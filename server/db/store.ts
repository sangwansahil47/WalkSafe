import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
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
  speed: number; // km/h or m/s
  timestamp: string;
}

export type JourneyStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ALERT' | 'SOS';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

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
  expectedDuration: number; // in minutes
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

export type AlertType = 'SOS' | 'AUTO_ESCALATION' | 'USER_REQUESTED_HELP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DEMO_SENT';

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

class SafeWalkStore {
  users: Map<string, User> = new Map();
  contacts: Map<string, EmergencyContact> = new Map();
  journeys: Map<string, Journey> = new Map();
  locationLogs: LocationLog[] = [];
  alerts: Map<string, SafetyAlert> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const demoUserId = 'user_rahul_demo';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('password123', salt);

    const demoUser: User = {
      id: demoUserId,
      name: 'Rahul Sharma',
      email: 'demo@safewalk.ai',
      phone: '+91 98765 43210',
      passwordHash,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    };
    this.users.set(demoUser.id, demoUser);

    const rahulUser: User = {
      id: 'user_rahul_alias',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91 98765 43210',
      passwordHash,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    };
    this.users.set(rahulUser.id, rahulUser);

    const walkSafeUser: User = {
      id: 'user_walksafe_demo',
      name: 'Rahul Sharma',
      email: 'demo@walksafe.ai',
      phone: '+91 98765 43210',
      passwordHash,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    };
    this.users.set(walkSafeUser.id, walkSafeUser);

    const motherContactId = 'contact_mother_01';
    const motherContact: EmergencyContact = {
      id: motherContactId,
      userId: demoUserId,
      name: 'Sunita Sharma (Mother)',
      email: 'mother.sharma@example.com',
      phone: '+91 98111 22334',
      relationship: 'Parent / Mother',
      isPrimary: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    };
    this.contacts.set(motherContact.id, motherContact);

    this.contacts.set('contact_mother_walksafe', {
      ...motherContact,
      id: 'contact_mother_walksafe',
      userId: 'user_walksafe_demo',
    });

    this.contacts.set('contact_mother_rahul', {
      ...motherContact,
      id: 'contact_mother_rahul',
      userId: 'user_rahul_alias',
    });

    const brotherContactId = 'contact_brother_02';
    const brotherContact: EmergencyContact = {
      id: brotherContactId,
      userId: demoUserId,
      name: 'Aman Sharma (Brother)',
      email: 'aman.sharma@example.com',
      phone: '+91 98222 33445',
      relationship: 'Sibling',
      isPrimary: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    };
    this.contacts.set(brotherContact.id, brotherContact);

    // Seed previous completed journeys for history showcase
    const pastJourney1: Journey = {
      id: 'journey_hist_01',
      userId: demoUserId,
      startLocation: { latitude: 28.5355, longitude: 77.391, name: 'University Campus Library' },
      destination: { latitude: 28.5700, longitude: 77.3200, name: 'Green Park Residence', address: 'B-44 Green Park' },
      expectedDuration: 35,
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      endTime: new Date(Date.now() - 1000 * 60 * 60 * 25.4).toISOString(),
      status: 'COMPLETED',
      riskScore: 12,
      riskLevel: 'LOW',
      lastRiskAnalysis: {
        riskScore: 12,
        riskLevel: 'LOW',
        routeDeviation: false,
        inactivityMinutes: 0,
        delayMinutes: 0,
        missedCheckIn: false,
        repeatedAnomaly: false,
        signals: ['Normal journey progression on designated path'],
        summary: 'All journey signals stayed within normal safe operating thresholds.',
        recommendedAction: 'CONTINUE',
        aiPowered: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25.4).toISOString(),
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 25.4).toISOString(),
    };
    this.journeys.set(pastJourney1.id, pastJourney1);

    const pastJourney2: Journey = {
      id: 'journey_hist_02',
      userId: demoUserId,
      startLocation: { latitude: 28.5450, longitude: 77.2700, name: 'Metro Station Gate 2' },
      destination: { latitude: 28.5800, longitude: 77.2300, name: 'Student Hostel Complex' },
      expectedDuration: 25,
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      endTime: new Date(Date.now() - 1000 * 60 * 60 * 47.3).toISOString(),
      status: 'COMPLETED',
      riskScore: 24,
      riskLevel: 'LOW',
      lastRiskAnalysis: {
        riskScore: 24,
        riskLevel: 'LOW',
        routeDeviation: false,
        inactivityMinutes: 2,
        delayMinutes: 0,
        missedCheckIn: false,
        repeatedAnomaly: false,
        signals: ['Brief pedestrian traffic delay near intersection'],
        summary: 'Minor slowdown encountered; journey safely concluded without risk escalation.',
        recommendedAction: 'CONTINUE',
        aiPowered: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 47.3).toISOString(),
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 47.3).toISOString(),
    };
    this.journeys.set(pastJourney2.id, pastJourney2);
  }

  // User methods
  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) {
        return u;
      }
    }
    return undefined;
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const id = 'user_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Contacts
  getContactsByUserId(userId: string): EmergencyContact[] {
    return Array.from(this.contacts.values()).filter((c) => c.userId === userId);
  }

  getPrimaryContact(userId: string): EmergencyContact | undefined {
    return Array.from(this.contacts.values()).find((c) => c.userId === userId && c.isPrimary);
  }

  getContactById(id: string): EmergencyContact | undefined {
    return this.contacts.get(id);
  }

  createContact(userId: string, data: Omit<EmergencyContact, 'id' | 'userId' | 'createdAt'>): EmergencyContact {
    const id = 'contact_' + Math.random().toString(36).substring(2, 10);
    const existing = this.getContactsByUserId(userId);
    const isFirst = existing.length === 0;
    const shouldBePrimary = data.isPrimary || isFirst;

    if (shouldBePrimary) {
      for (const c of existing) {
        if (c.isPrimary) {
          this.contacts.set(c.id, { ...c, isPrimary: false });
        }
      }
    }

    const newContact: EmergencyContact = {
      ...data,
      id,
      userId,
      isPrimary: shouldBePrimary,
      createdAt: new Date().toISOString(),
    };
    this.contacts.set(id, newContact);
    return newContact;
  }

  updateContact(id: string, userId: string, updates: Partial<EmergencyContact>): EmergencyContact | undefined {
    const contact = this.contacts.get(id);
    if (!contact || contact.userId !== userId) return undefined;

    if (updates.isPrimary) {
      const existing = this.getContactsByUserId(userId);
      for (const c of existing) {
        if (c.id !== id && c.isPrimary) {
          this.contacts.set(c.id, { ...c, isPrimary: false });
        }
      }
    }

    const updated = { ...contact, ...updates };
    this.contacts.set(id, updated);
    return updated;
  }

  deleteContact(id: string, userId: string): boolean {
    const contact = this.contacts.get(id);
    if (!contact || contact.userId !== userId) return false;
    this.contacts.delete(id);

    // If deleted contact was primary, make the first remaining primary
    if (contact.isPrimary) {
      const remaining = this.getContactsByUserId(userId);
      if (remaining.length > 0) {
        this.contacts.set(remaining[0].id, { ...remaining[0], isPrimary: true });
      }
    }
    return true;
  }

  // Journeys
  createJourney(userId: string, data: { startLocation: LocationPoint; destination: LocationPoint; expectedDuration: number }): Journey {
    const id = 'journey_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    const now = new Date().toISOString();
    const newJourney: Journey = {
      id,
      userId,
      startLocation: data.startLocation,
      destination: data.destination,
      expectedDuration: data.expectedDuration,
      startTime: now,
      status: 'ACTIVE',
      riskScore: 10,
      riskLevel: 'LOW',
      lastRiskAnalysis: {
        riskScore: 10,
        riskLevel: 'LOW',
        routeDeviation: false,
        inactivityMinutes: 0,
        delayMinutes: 0,
        missedCheckIn: false,
        repeatedAnomaly: false,
        signals: ['Journey initialized at starting coordinates'],
        summary: 'SafeWalk AI monitoring started. Journey signals are normal.',
        recommendedAction: 'CONTINUE',
        aiPowered: false,
        timestamp: now,
      },
      createdAt: now,
      updatedAt: now,
    };
    this.journeys.set(id, newJourney);

    // Log initial start coordinate
    this.addLocationLog(id, data.startLocation.latitude, data.startLocation.longitude, 0);

    return newJourney;
  }

  getJourneyById(id: string): Journey | undefined {
    return this.journeys.get(id);
  }

  getActiveJourney(userId: string): Journey | undefined {
    for (const j of this.journeys.values()) {
      if (j.userId === userId && (j.status === 'ACTIVE' || j.status === 'ALERT')) {
        return j;
      }
    }
    return undefined;
  }

  getJourneysByUserId(userId: string): Journey[] {
    return Array.from(this.journeys.values())
      .filter((j) => j.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateJourney(id: string, updates: Partial<Journey>): Journey | undefined {
    const journey = this.journeys.get(id);
    if (!journey) return undefined;
    const updated = {
      ...journey,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.journeys.set(id, updated);
    return updated;
  }

  // Location Logs
  addLocationLog(journeyId: string, latitude: number, longitude: number, speed: number = 0): LocationLog {
    const log: LocationLog = {
      id: 'loc_' + Math.random().toString(36).substring(2, 9),
      journeyId,
      latitude,
      longitude,
      speed,
      timestamp: new Date().toISOString(),
    };
    this.locationLogs.push(log);
    return log;
  }

  getLocationLogsByJourneyId(journeyId: string): LocationLog[] {
    return this.locationLogs
      .filter((l) => l.journeyId === journeyId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Safety Alerts
  createAlert(data: Omit<SafetyAlert, 'id' | 'createdAt'>): SafetyAlert {
    const id = 'alert_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const alert: SafetyAlert = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.alerts.set(id, alert);
    return alert;
  }

  getAlertById(id: string): SafetyAlert | undefined {
    return this.alerts.get(id);
  }

  getAlertsByUserId(userId: string): SafetyAlert[] {
    return Array.from(this.alerts.values())
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const store = new SafeWalkStore();
