import { Response } from 'express';
import { store, Journey } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { riskService } from '../services/riskService';
import { aiService } from '../services/aiService';

export const createJourney = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { startLocation, destination, expectedDuration } = req.body;

  if (!startLocation || startLocation.latitude === undefined || startLocation.longitude === undefined) {
    return res.status(400).json({ error: 'Valid start location coordinates are required.' });
  }
  if (!destination || !destination.name) {
    return res.status(400).json({ error: 'Destination information is required.' });
  }

  const durationNum = parseInt(expectedDuration, 10);
  if (isNaN(durationNum) || durationNum <= 0) {
    return res.status(400).json({ error: 'Valid expected duration in minutes is required.' });
  }

  // Ensure any previous active journey is marked completed or replaced
  const existingActive = store.getActiveJourney(req.user.id);
  if (existingActive) {
    store.updateJourney(existingActive.id, {
      status: 'COMPLETED',
      endTime: new Date().toISOString(),
    });
  }

  const destCoords = {
    latitude: destination.latitude || startLocation.latitude + 0.015,
    longitude: destination.longitude || startLocation.longitude + 0.015,
    name: destination.name,
    address: destination.address || destination.name,
  };

  const journey = store.createJourney(req.user.id, {
    startLocation: {
      latitude: startLocation.latitude,
      longitude: startLocation.longitude,
      name: startLocation.name || 'Current Location',
    },
    destination: destCoords,
    expectedDuration: durationNum,
  });

  return res.status(201).json({
    message: 'Safe journey initialized.',
    journey,
  });
};

export const getActiveJourney = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const journey = store.getActiveJourney(req.user.id);
  if (!journey) {
    return res.json({ journey: null, locationLogs: [] });
  }

  const locationLogs = store.getLocationLogsByJourneyId(journey.id);
  return res.json({ journey, locationLogs });
};

export const getJourneys = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const journeys = store.getJourneysByUserId(req.user.id);
  return res.json({ journeys });
};

export const getJourneyById = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params;
  const journey = store.getJourneyById(id);
  if (!journey || journey.userId !== req.user.id) {
    return res.status(404).json({ error: 'Journey not found.' });
  }

  const locationLogs = store.getLocationLogsByJourneyId(id);
  return res.json({ journey, locationLogs });
};

export const recordLocation = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params;
  const { latitude, longitude, speed } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and longitude coordinates are required.' });
  }

  const journey = store.getJourneyById(id);
  if (!journey || journey.userId !== req.user.id) {
    return res.status(404).json({ error: 'Journey not found.' });
  }

  if (journey.status !== 'ACTIVE' && journey.status !== 'ALERT') {
    return res.status(400).json({ error: 'Cannot append location to an inactive journey.' });
  }

  // 1. Log location
  store.addLocationLog(journey.id, latitude, longitude, speed || 0);
  const locationLogs = store.getLocationLogsByJourneyId(journey.id);

  // 2. Deterministic Risk Evaluation
  const riskAnalysis = riskService.evaluateJourney(journey, locationLogs);

  // 3. AI Safety Summary Explanation
  const aiExplanation = await aiService.explainRisk({
    riskScore: riskAnalysis.riskScore,
    riskLevel: riskAnalysis.riskLevel,
    routeDeviation: riskAnalysis.routeDeviation,
    delayMinutes: riskAnalysis.delayMinutes,
    inactivityMinutes: riskAnalysis.inactivityMinutes,
    missedCheckIn: riskAnalysis.missedCheckIn,
    journeyDetails: {
      startLocationName: journey.startLocation.name,
      destinationName: journey.destination.name,
      expectedDuration: journey.expectedDuration,
      userName: req.user.name,
    },
  });

  riskAnalysis.summary = aiExplanation.summary;
  riskAnalysis.signals = aiExplanation.signals;
  riskAnalysis.recommendedAction = aiExplanation.recommendedAction;
  riskAnalysis.aiPowered = true;

  const checkInNeeded = riskAnalysis.riskLevel === 'HIGH' || riskAnalysis.riskLevel === 'CRITICAL';
  const updates: Partial<Journey> = {
    riskScore: riskAnalysis.riskScore,
    riskLevel: riskAnalysis.riskLevel,
    lastRiskAnalysis: riskAnalysis,
  };

  if (checkInNeeded && !journey.checkInRequired) {
    updates.checkInRequired = true;
    updates.checkInTriggeredAt = new Date().toISOString();
  }

  const updatedJourney = store.updateJourney(journey.id, updates);

  return res.json({
    message: 'Location recorded and risk evaluated.',
    journey: updatedJourney,
    riskAnalysis,
    locationLogs,
  });
};

export const checkIn = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params;
  const journey = store.getJourneyById(id);
  if (!journey || journey.userId !== req.user.id) {
    return res.status(404).json({ error: 'Journey not found.' });
  }

  // User confirmed "I'M SAFE"
  const now = new Date().toISOString();
  const healthyScore = 18;
  const healthyAnalysis = {
    riskScore: healthyScore,
    riskLevel: 'LOW' as const,
    routeDeviation: false,
    inactivityMinutes: 0,
    delayMinutes: 0,
    missedCheckIn: false,
    repeatedAnomaly: false,
    signals: ['User confirmed safety via interactive check-in'],
    summary: 'Traveler verified their wellbeing. SafeWalk AI normal monitoring resumed.',
    recommendedAction: 'CONTINUE' as const,
    aiPowered: false,
    timestamp: now,
  };

  const updated = store.updateJourney(journey.id, {
    status: 'ACTIVE',
    riskScore: healthyScore,
    riskLevel: 'LOW',
    checkInRequired: false,
    checkInTriggeredAt: undefined,
    lastCheckInAt: now,
    lastRiskAnalysis: healthyAnalysis,
  });

  return res.json({
    message: 'Safety check-in recorded. Journey continuing safely.',
    journey: updated,
  });
};

export const endJourney = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params;
  const { status } = req.body; // 'COMPLETED' or 'CANCELLED'

  const journey = store.getJourneyById(id);
  if (!journey || journey.userId !== req.user.id) {
    return res.status(404).json({ error: 'Journey not found.' });
  }

  const finalStatus = status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED';
  const updated = store.updateJourney(journey.id, {
    status: finalStatus,
    endTime: new Date().toISOString(),
    checkInRequired: false,
  });

  return res.json({
    message: `Journey ended with status: ${finalStatus}`,
    journey: updated,
  });
};

export const simulateEvent = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params;
  const { eventType } = req.body;

  const journey = store.getJourneyById(id);
  if (!journey || journey.userId !== req.user.id) {
    return res.status(404).json({ error: 'Journey not found.' });
  }

  const logs = store.getLocationLogsByJourneyId(journey.id);
  const latestLog = logs[logs.length - 1] || {
    latitude: journey.startLocation.latitude,
    longitude: journey.startLocation.longitude,
  };

  let simulatedScore = 18;
  let simulatedLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let checkInRequired = false;
  let simulatedSignals = {
    routeDeviation: false,
    inactivityMinutes: 0,
    delayMinutes: 0,
    missedCheckIn: false,
    repeatedAnomaly: false,
  };

  if (eventType === 'NORMAL') {
    simulatedScore = 18;
    simulatedLevel = 'LOW';
    checkInRequired = false;
    // Add point slightly progressing towards dest
    const lat = latestLog.latitude + 0.002;
    const lon = latestLog.longitude + 0.002;
    store.addLocationLog(journey.id, lat, lon, 4.5);
  } else if (eventType === 'ROUTE_DEVIATION') {
    simulatedScore = 43;
    simulatedLevel = 'MODERATE';
    simulatedSignals.routeDeviation = true;
    checkInRequired = false;
    // Add point significantly off route
    const lat = latestLog.latitude + 0.009;
    const lon = latestLog.longitude - 0.008;
    store.addLocationLog(journey.id, lat, lon, 3.8);
  } else if (eventType === 'INACTIVITY') {
    simulatedScore = 68;
    simulatedLevel = 'HIGH';
    simulatedSignals.inactivityMinutes = 8;
    simulatedSignals.repeatedAnomaly = true;
    checkInRequired = true;
    // Stationary point with speed 0
    store.addLocationLog(journey.id, latestLog.latitude, latestLog.longitude, 0);
  } else if (eventType === 'MISSED_CHECKIN') {
    simulatedScore = 88;
    simulatedLevel = 'CRITICAL';
    simulatedSignals.routeDeviation = true;
    simulatedSignals.inactivityMinutes = 9;
    simulatedSignals.missedCheckIn = true;
    simulatedSignals.repeatedAnomaly = true;
    checkInRequired = true;
  } else if (eventType === 'HIGH_RISK') {
    simulatedScore = 75;
    simulatedLevel = 'HIGH';
    simulatedSignals.routeDeviation = true;
    simulatedSignals.delayMinutes = 12;
    simulatedSignals.repeatedAnomaly = true;
    checkInRequired = true;
  }

  // Get AI explanation for the simulated event
  const aiExplanation = await aiService.explainRisk({
    riskScore: simulatedScore,
    riskLevel: simulatedLevel,
    routeDeviation: simulatedSignals.routeDeviation,
    delayMinutes: simulatedSignals.delayMinutes,
    inactivityMinutes: simulatedSignals.inactivityMinutes,
    missedCheckIn: simulatedSignals.missedCheckIn,
    journeyDetails: {
      startLocationName: journey.startLocation.name,
      destinationName: journey.destination.name,
      expectedDuration: journey.expectedDuration,
      userName: req.user.name,
    },
  });

  const now = new Date().toISOString();
  const analysis = {
    riskScore: simulatedScore,
    riskLevel: simulatedLevel,
    ...simulatedSignals,
    signals: aiExplanation.signals,
    summary: aiExplanation.summary,
    recommendedAction: aiExplanation.recommendedAction,
    aiPowered: true,
    timestamp: now,
  };

  const updatedJourney = store.updateJourney(journey.id, {
    riskScore: simulatedScore,
    riskLevel: simulatedLevel,
    checkInRequired,
    checkInTriggeredAt: checkInRequired ? now : undefined,
    lastRiskAnalysis: analysis,
  });

  const updatedLogs = store.getLocationLogsByJourneyId(journey.id);

  return res.json({
    message: `Simulated event "${eventType}" applied.`,
    journey: updatedJourney,
    riskAnalysis: analysis,
    locationLogs: updatedLogs,
  });
};
