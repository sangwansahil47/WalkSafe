export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type JourneyStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ALERT' | 'SOS';
export type AlertType = 'SOS' | 'AUTO_ESCALATION' | 'USER_REQUESTED_HELP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DEMO_SENT';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  hasPrimaryContact?: boolean;
  primaryContactName?: string;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface LocationLog {
  id: string;
  journeyId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export interface RiskAnalysis {
  riskScore: number;
  riskLevel: RiskLevel;
  routeDeviation: boolean;
  inactivityMinutes: number;
  delayMinutes: number;
  missedCheckIn: boolean;
  repeatedAnomaly: boolean;
  signals: string[];
  summary: string;
  recommendedAction: 'CONTINUE' | 'CHECK_IN' | 'NOTIFY_TRUSTED_CONTACT';
  aiPowered: boolean;
  timestamp: string;
}

export interface Journey {
  id: string;
  userId: string;
  startLocation: LocationPoint;
  destination: LocationPoint;
  expectedDuration: number;
  startTime: string;
  endTime?: string;
  status: JourneyStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  lastRiskAnalysis?: RiskAnalysis;
  lastCheckInAt?: string;
  checkInRequired?: boolean;
  checkInTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyAlert {
  id: string;
  userId: string;
  journeyId?: string;
  type: AlertType;
  riskScore: number;
  riskLevel: RiskLevel;
  reason: string;
  message: string;
  lastKnownLocation: LocationPoint;
  notificationStatus: NotificationStatus;
  contactNotified?: {
    name: string;
    phone: string;
    email: string;
    relationship: string;
  };
  simulatedNotification?: boolean;
  createdAt: string;
}
