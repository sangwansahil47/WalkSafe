import { Response } from 'express';
import { store, SafetyAlert, EmergencyContact } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { notificationService } from '../services/notificationService';

export const triggerSOS = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params; // journeyId (optional if triggered globally from dashboard)
  const { latitude, longitude } = req.body;

  const journey = id ? store.getJourneyById(id) : store.getActiveJourney(req.user.id);
  const contacts = store.getContactsByUserId(req.user.id);
  let primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  // Fallback demo contact if user hasn't added any yet
  if (!primaryContact) {
    primaryContact = store.createContact(req.user.id, {
      name: 'Default Emergency Contact',
      email: 'emergency.support@safewalk.ai',
      phone: '+91 99999 00000',
      relationship: 'Emergency Contact',
      isPrimary: true,
    });
  }

  const logs = journey ? store.getLocationLogsByJourneyId(journey.id) : [];
  const latestLog = logs[logs.length - 1];

  const loc = {
    latitude: latitude || latestLog?.latitude || journey?.startLocation.latitude || 28.5355,
    longitude: longitude || latestLog?.longitude || journey?.startLocation.longitude || 77.391,
    name: journey?.destination.name || 'Current Emergency Coordinates',
  };

  const alert = store.createAlert({
    userId: req.user.id,
    journeyId: journey?.id,
    type: 'SOS',
    riskScore: 100,
    riskLevel: 'CRITICAL',
    reason: 'Direct Emergency SOS activated by traveler.',
    message: `Immediate SOS triggered by ${req.user.name}.`,
    lastKnownLocation: loc,
    notificationStatus: 'PENDING',
    contactNotified: {
      name: primaryContact.name,
      phone: primaryContact.phone,
      email: primaryContact.email,
      relationship: primaryContact.relationship,
    },
    simulatedNotification: true,
  });

  if (journey) {
    store.updateJourney(journey.id, {
      status: 'SOS',
      riskScore: 100,
      riskLevel: 'CRITICAL',
      checkInRequired: false,
    });
  }

  // Dispatch emergency notification
  const dispatchResult = await notificationService.sendEmergencyAlert(
    req.user,
    primaryContact,
    alert,
    journey
  );

  alert.notificationStatus = dispatchResult.status;
  alert.simulatedNotification = dispatchResult.simulated;

  return res.status(201).json({
    message: 'EMERGENCY SOS DISPATCHED: Trusted contact has been alerted.',
    alert,
    dispatchResult,
  });
};

export const requestHelp = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params;
  const journey = store.getJourneyById(id);
  if (!journey || journey.userId !== req.user.id) {
    return res.status(404).json({ error: 'Journey not found.' });
  }

  const contacts = store.getContactsByUserId(req.user.id);
  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  if (!primaryContact) {
    return res.status(400).json({ error: 'Please configure at least one trusted emergency contact.' });
  }

  const logs = store.getLocationLogsByJourneyId(journey.id);
  const latestLog = logs[logs.length - 1];
  const loc = {
    latitude: latestLog?.latitude || journey.startLocation.latitude,
    longitude: latestLog?.longitude || journey.startLocation.longitude,
    name: journey.destination.name,
  };

  const alert = store.createAlert({
    userId: req.user.id,
    journeyId: journey.id,
    type: 'USER_REQUESTED_HELP',
    riskScore: 90,
    riskLevel: 'CRITICAL',
    reason: 'Traveler selected "I NEED HELP" during active safety check-in.',
    message: `${req.user.name} reported needing immediate safety assistance.`,
    lastKnownLocation: loc,
    notificationStatus: 'PENDING',
    contactNotified: {
      name: primaryContact.name,
      phone: primaryContact.phone,
      email: primaryContact.email,
      relationship: primaryContact.relationship,
    },
    simulatedNotification: true,
  });

  store.updateJourney(journey.id, {
    status: 'ALERT',
    riskScore: 90,
    riskLevel: 'CRITICAL',
    checkInRequired: false,
  });

  const dispatchResult = await notificationService.sendEmergencyAlert(
    req.user,
    primaryContact,
    alert,
    journey
  );

  alert.notificationStatus = dispatchResult.status;
  alert.simulatedNotification = dispatchResult.simulated;

  return res.status(201).json({
    message: 'Help request alert sent to trusted contact.',
    alert,
    dispatchResult,
  });
};

export const autoEscalate = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params;
  const journey = store.getJourneyById(id);
  if (!journey || journey.userId !== req.user.id) {
    return res.status(404).json({ error: 'Journey not found.' });
  }

  const contacts = store.getContactsByUserId(req.user.id);
  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  if (!primaryContact) {
    return res.status(400).json({ error: 'No emergency contact available for automatic escalation.' });
  }

  const logs = store.getLocationLogsByJourneyId(journey.id);
  const latestLog = logs[logs.length - 1];
  const loc = {
    latitude: latestLog?.latitude || journey.startLocation.latitude,
    longitude: latestLog?.longitude || journey.startLocation.longitude,
    name: journey.destination.name,
  };

  const alert = store.createAlert({
    userId: req.user.id,
    journeyId: journey.id,
    type: 'AUTO_ESCALATION',
    riskScore: 95,
    riskLevel: 'CRITICAL',
    reason: 'The journey showed significant route deviation and the user did not respond to the safety check-in countdown.',
    message: `Automatic Safety Escalation: ${req.user.name} was unreachable during safety check-in window.`,
    lastKnownLocation: loc,
    notificationStatus: 'PENDING',
    contactNotified: {
      name: primaryContact.name,
      phone: primaryContact.phone,
      email: primaryContact.email,
      relationship: primaryContact.relationship,
    },
    simulatedNotification: true,
  });

  store.updateJourney(journey.id, {
    status: 'ALERT',
    riskScore: 95,
    riskLevel: 'CRITICAL',
    checkInRequired: false,
  });

  const dispatchResult = await notificationService.sendEmergencyAlert(
    req.user,
    primaryContact,
    alert,
    journey
  );

  alert.notificationStatus = dispatchResult.status;
  alert.simulatedNotification = dispatchResult.simulated;

  return res.status(201).json({
    message: 'Automatic safety escalation triggered. Emergency contact notified.',
    alert,
    dispatchResult,
  });
};

export const getAlerts = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const alerts = store.getAlertsByUserId(req.user.id);
  return res.json({ alerts });
};

export const getAlertById = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params;
  const alert = store.getAlertById(id);
  if (!alert || alert.userId !== req.user.id) {
    return res.status(404).json({ error: 'Alert not found.' });
  }

  return res.json({ alert });
};
