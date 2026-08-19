import { Journey, LocationLog, RiskLevel, RiskAnalysis } from '../db/store';

export interface SignalInputs {
  routeDeviation?: boolean;
  inactivityMinutes?: number;
  delayMinutes?: number;
  missedCheckIn?: boolean;
  repeatedAnomaly?: boolean;
}

export class RiskService {
  /**
   * Calculates deterministic risk score based on specified formula:
   * base = 0
   * route deviation = +25
   * inactivity (>=5min) = +25
   * delay (>=5min) = +15
   * missed check-in = +30
   * repeated anomaly (multiple signals) = +15
   * max = 100
   */
  calculateDeterministicRisk(signals: SignalInputs): {
    score: number;
    level: RiskLevel;
    detectedSignals: string[];
    requiresCheckIn: boolean;
  } {
    let score = 0;
    const detectedSignals: string[] = [];
    let anomalyCount = 0;

    if (signals.routeDeviation) {
      score += 25;
      anomalyCount += 1;
      detectedSignals.push('Route deviation detected from planned corridor (+25)');
    }

    if (signals.inactivityMinutes && signals.inactivityMinutes >= 5) {
      score += 25;
      anomalyCount += 1;
      detectedSignals.push(`Prolonged stationary inactivity (${Math.round(signals.inactivityMinutes)} mins) (+25)`);
    }

    if (signals.delayMinutes && signals.delayMinutes >= 5) {
      score += 15;
      anomalyCount += 1;
      detectedSignals.push(`Journey duration delayed by ${Math.round(signals.delayMinutes)} mins beyond expected (+15)`);
    }

    if (signals.missedCheckIn) {
      score += 30;
      anomalyCount += 1;
      detectedSignals.push('Missed safety check-in prompt (+30)');
    }

    // Repeated anomaly: if 2 or more signals occurred
    if (anomalyCount >= 2 || signals.repeatedAnomaly) {
      score += 15;
      detectedSignals.push('Multiple coinciding safety anomalies (+15)');
    }

    if (score === 0) {
      score = 10; // Baseline healthy journey
      detectedSignals.push('Journey progressing normally along safe path');
    }

    // Clamp score to maximum 100
    score = Math.min(100, Math.max(0, score));

    // Determine level strictly per spec
    let level: RiskLevel = 'LOW';
    if (score >= 81) {
      level = 'CRITICAL';
    } else if (score >= 61) {
      level = 'HIGH';
    } else if (score >= 31) {
      level = 'MODERATE';
    } else {
      level = 'LOW';
    }

    const requiresCheckIn = level === 'HIGH' || level === 'CRITICAL';

    return {
      score,
      level,
      detectedSignals,
      requiresCheckIn,
    };
  }

  /**
   * Analyzes journey data and recent location logs to compute real-time signals
   */
  evaluateJourney(journey: Journey, locationLogs: LocationLog[], manualOverrideSignals?: SignalInputs): RiskAnalysis {
    const now = Date.now();
    const startTime = new Date(journey.startTime).getTime();
    const elapsedMinutes = (now - startTime) / (1000 * 60);

    // Compute delay
    const delayMinutes = Math.max(0, elapsedMinutes - journey.expectedDuration);

    // Compute inactivity
    let inactivityMinutes = 0;
    if (locationLogs.length >= 2) {
      const latest = locationLogs[locationLogs.length - 1];
      const previous = locationLogs[locationLogs.length - 2];
      const timeDiffMin = (new Date(latest.timestamp).getTime() - new Date(previous.timestamp).getTime()) / (1000 * 60);
      const distMeters = this.calculateDistanceMeters(
        latest.latitude,
        latest.longitude,
        previous.latitude,
        previous.longitude
      );

      if (distMeters < 15 && latest.speed < 0.5) {
        // stationary
        inactivityMinutes = Math.max(timeDiffMin, (now - new Date(latest.timestamp).getTime()) / (1000 * 60));
      }
    }

    // Compute route deviation (distance from line between start and destination)
    let routeDeviation = false;
    if (locationLogs.length > 0) {
      const latest = locationLogs[locationLogs.length - 1];
      const distOffRoute = this.calculateDistanceToRouteCorridor(
        latest.latitude,
        latest.longitude,
        journey.startLocation.latitude,
        journey.startLocation.longitude,
        journey.destination.latitude,
        journey.destination.longitude
      );
      // If deviated more than 500 meters from start->destination corridor
      if (distOffRoute > 500) {
        routeDeviation = true;
      }
    }

    // Merge with any manual override signals (e.g. from demo simulation)
    const combinedSignals: SignalInputs = {
      routeDeviation: manualOverrideSignals?.routeDeviation !== undefined ? manualOverrideSignals.routeDeviation : routeDeviation,
      inactivityMinutes: manualOverrideSignals?.inactivityMinutes !== undefined ? manualOverrideSignals.inactivityMinutes : inactivityMinutes,
      delayMinutes: manualOverrideSignals?.delayMinutes !== undefined ? manualOverrideSignals.delayMinutes : delayMinutes,
      missedCheckIn: manualOverrideSignals?.missedCheckIn !== undefined ? manualOverrideSignals.missedCheckIn : false,
      repeatedAnomaly: manualOverrideSignals?.repeatedAnomaly !== undefined ? manualOverrideSignals.repeatedAnomaly : false,
    };

    const calculation = this.calculateDeterministicRisk(combinedSignals);

    let recommendedAction: 'CONTINUE' | 'CHECK_IN' | 'NOTIFY_TRUSTED_CONTACT' = 'CONTINUE';
    if (calculation.level === 'CRITICAL' && combinedSignals.missedCheckIn) {
      recommendedAction = 'NOTIFY_TRUSTED_CONTACT';
    } else if (calculation.requiresCheckIn) {
      recommendedAction = 'CHECK_IN';
    }

    const summary = this.generateDeterministicSummary(calculation.level, calculation.detectedSignals, combinedSignals);

    return {
      riskScore: calculation.score,
      riskLevel: calculation.level,
      routeDeviation: !!combinedSignals.routeDeviation,
      inactivityMinutes: Math.round(combinedSignals.inactivityMinutes || 0),
      delayMinutes: Math.round(combinedSignals.delayMinutes || 0),
      missedCheckIn: !!combinedSignals.missedCheckIn,
      repeatedAnomaly: !!combinedSignals.repeatedAnomaly,
      signals: calculation.detectedSignals,
      summary,
      recommendedAction,
      aiPowered: false,
      timestamp: new Date().toISOString(),
    };
  }

  generateDeterministicSummary(level: RiskLevel, detectedSignals: string[], signals: SignalInputs): string {
    if (level === 'LOW') {
      return 'Journey is proceeding along the expected route within normal time limits. No immediate safety concerns.';
    }
    if (level === 'MODERATE') {
      return `SafeWalk AI noticed minor variance: ${signals.routeDeviation ? 'unexpected route detour' : 'transit delay'}. Safe monitoring active.`;
    }
    if (level === 'HIGH') {
      return 'Multiple safety anomalies detected (such as stationary inactivity or significant deviation). Safety check-in requested to verify wellbeing.';
    }
    return 'Critical journey deviation or unacknowledged check-in. Initiating trusted emergency contact escalation countdown.';
  }

  // Haversine distance in meters
  calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Distance from point to segment in meters
  calculateDistanceToRouteCorridor(
    pLat: number,
    pLon: number,
    startLat: number,
    startLon: number,
    destLat: number,
    destLon: number
  ): number {
    // Approximate cross-track distance using equirectangular projection
    const dStartDest = this.calculateDistanceMeters(startLat, startLon, destLat, destLon);
    if (dStartDest < 10) return this.calculateDistanceMeters(pLat, pLon, startLat, startLon);

    const dStartP = this.calculateDistanceMeters(startLat, startLon, pLat, pLon);
    const dDestP = this.calculateDistanceMeters(destLat, destLon, pLat, pLon);

    // Heron's formula for triangle area to find perpendicular height
    const s = (dStartDest + dStartP + dDestP) / 2;
    const area = Math.sqrt(Math.max(0, s * (s - dStartDest) * (s - dStartP) * (s - dDestP)));
    const height = (2 * area) / dStartDest;

    return height;
  }
}

export const riskService = new RiskService();
