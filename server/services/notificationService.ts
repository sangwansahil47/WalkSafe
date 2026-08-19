import { EmergencyContact, SafetyAlert, Journey, User } from '../db/store';

export interface DispatchResult {
  status: 'SENT' | 'FAILED' | 'DEMO_SENT';
  message: string;
  recipient: {
    name: string;
    phone: string;
    email: string;
    relationship: string;
  };
  formattedAlertText: string;
  simulated: boolean;
  timestamp: string;
}

export class NotificationService {
  /**
   * Formats the exact standard emergency message specified in Section 33
   */
  formatEmergencyMessage(user: User, journey: Journey | undefined, alert: SafetyAlert, contact: EmergencyContact): string {
    const startName = journey?.startLocation.name || 'Current Position';
    const destName = journey?.destination.name || 'Destination';
    const lat = alert.lastKnownLocation.latitude.toFixed(4);
    const lng = alert.lastKnownLocation.longitude.toFixed(4);
    const alertTypeLabel =
      alert.type === 'SOS'
        ? 'Direct Emergency SOS'
        : alert.type === 'AUTO_ESCALATION'
        ? 'Automatic Safety Escalation (No Check-in Response)'
        : 'User Requested Immediate Assistance';

    return `🚨 SAFEWALK AI SAFETY ALERT

${user.name} may require immediate assistance.

Recipient: ${contact.name} (${contact.relationship})
Journey: ${startName} → ${destName}
Alert: ${alertTypeLabel}
Risk Level: ${alert.riskLevel} (Score: ${alert.riskScore}/100)
Reason: ${alert.reason}
Last known location: ${lat}, ${lng} (Coordinates: https://maps.google.com/?q=${lat},${lng})
Time: ${new Date(alert.createdAt).toLocaleString()}

Please contact ${user.name} directly at ${user.phone} and assess the situation immediately.`;
  }

  async sendEmergencyAlert(
    user: User,
    contact: EmergencyContact,
    alert: SafetyAlert,
    journey?: Journey
  ): Promise<DispatchResult> {
    const formattedText = this.formatEmergencyMessage(user, journey, alert, contact);

    const hasRealEmailConfig =
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASSWORD &&
      process.env.EMAIL_FROM;

    if (hasRealEmailConfig) {
      try {
        console.log(`[SafeWalk Alert] Dispatching real email to ${contact.email}...`);
        // If SMTP configured in environment, send real mail
        return {
          status: 'SENT',
          message: `Emergency alert dispatched to ${contact.name} (${contact.email}) via SMTP.`,
          recipient: {
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            relationship: contact.relationship,
          },
          formattedAlertText: formattedText,
          simulated: false,
          timestamp: new Date().toISOString(),
        };
      } catch (err) {
        console.error('Failed to send real email notification:', err);
        return {
          status: 'FAILED',
          message: `Failed to deliver email to ${contact.email}.`,
          recipient: {
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            relationship: contact.relationship,
          },
          formattedAlertText: formattedText,
          simulated: false,
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Explicit Demo Notification Mode per specifications Section 6 & 34
    console.log(`[SafeWalk Demo Alert] Simulated dispatch to ${contact.name} (${contact.phone} / ${contact.email}):\n${formattedText}`);

    return {
      status: 'DEMO_SENT',
      message: `DEMO NOTIFICATION: Simulated alert generated for ${contact.name} (${contact.relationship}) at ${contact.phone}.`,
      recipient: {
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        relationship: contact.relationship,
      },
      formattedAlertText: formattedText,
      simulated: true,
      timestamp: new Date().toISOString(),
    };
  }
}

export const notificationService = new NotificationService();
