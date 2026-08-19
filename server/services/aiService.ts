import { GoogleGenAI, Type } from '@google/genai';
import { RiskLevel, RiskAnalysis } from '../db/store';

export interface AiRiskInput {
  riskScore: number;
  riskLevel: RiskLevel;
  routeDeviation: boolean;
  delayMinutes: number;
  inactivityMinutes: number;
  missedCheckIn: boolean;
  journeyDetails?: {
    startLocationName?: string;
    destinationName?: string;
    expectedDuration?: number;
    userName?: string;
  };
}

export interface AiRiskOutput {
  summary: string;
  recommendedAction: 'CONTINUE' | 'CHECK_IN' | 'NOTIFY_TRUSTED_CONTACT';
  signals: string[];
}

export class AiService {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      return null;
    }
    try {
      return new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }

  async explainRisk(input: AiRiskInput): Promise<AiRiskOutput> {
    const ai = this.getClient();
    if (!ai) {
      return this.fallbackExplanation(input);
    }

    try {
      const prompt = `You are the SafeWalk AI journey safety assessment assistant.
You provide clear, objective, calm, and accurate safety explanations for solo travelers based on deterministic journey telemetry.

Telemetry Data:
- Risk Score: ${input.riskScore}/100
- Risk Level: ${input.riskLevel}
- Route Deviation: ${input.routeDeviation ? 'YES (deviated off planned route)' : 'NO'}
- Inactivity: ${input.inactivityMinutes} minutes stationary
- Delay: ${input.delayMinutes} minutes beyond expected duration
- Missed Safety Check-in: ${input.missedCheckIn ? 'YES' : 'NO'}
${input.journeyDetails ? `- Context: Traveling from "${input.journeyDetails.startLocationName || 'Start'}" to "${input.journeyDetails.destinationName || 'Destination'}"` : ''}

Respond in strict JSON conforming to this schema:
{
  "summary": "1-2 sentence calm, reassuring yet precise explanation of the current journey telemetry and safety status.",
  "recommendedAction": "CONTINUE" | "CHECK_IN" | "NOTIFY_TRUSTED_CONTACT",
  "signals": ["list", "of", "key", "telemetry", "observations"]
}`;

      const model = process.env.AI_MODEL || 'gemini-2.5-flash';
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'A 1-2 sentence clear explanation of the journey signals and safety situation.',
              },
              recommendedAction: {
                type: Type.STRING,
                description: 'Recommended action: CONTINUE, CHECK_IN, or NOTIFY_TRUSTED_CONTACT',
              },
              signals: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: 'Bullet list of detected journey signals.',
              },
            },
            required: ['summary', 'recommendedAction', 'signals'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        return this.fallbackExplanation(input);
      }

      const parsed = JSON.parse(text);
      const validActions = ['CONTINUE', 'CHECK_IN', 'NOTIFY_TRUSTED_CONTACT'];
      const action = validActions.includes(parsed.recommendedAction)
        ? (parsed.recommendedAction as 'CONTINUE' | 'CHECK_IN' | 'NOTIFY_TRUSTED_CONTACT')
        : input.riskLevel === 'CRITICAL'
        ? 'NOTIFY_TRUSTED_CONTACT'
        : input.riskLevel === 'HIGH'
        ? 'CHECK_IN'
        : 'CONTINUE';

      return {
        summary: parsed.summary || this.fallbackExplanation(input).summary,
        recommendedAction: action,
        signals: Array.isArray(parsed.signals) && parsed.signals.length > 0
          ? parsed.signals
          : this.fallbackExplanation(input).signals,
      };
    } catch (error) {
      console.warn('Gemini AI call failed, falling back to deterministic explanation:', error);
      return this.fallbackExplanation(input);
    }
  }

  fallbackExplanation(input: AiRiskInput): AiRiskOutput {
    const signals: string[] = [];
    if (input.routeDeviation) signals.push('Significant deviation from expected route trajectory');
    if (input.inactivityMinutes >= 5) signals.push(`Prolonged stationary inactivity for ${input.inactivityMinutes} minutes`);
    if (input.delayMinutes >= 5) signals.push(`Journey duration delayed by ${input.delayMinutes} minutes`);
    if (input.missedCheckIn) signals.push('No response to interactive safety check-in prompt');
    if (signals.length === 0) signals.push('Normal journey progression on designated path');

    let summary = '';
    let recommendedAction: 'CONTINUE' | 'CHECK_IN' | 'NOTIFY_TRUSTED_CONTACT' = 'CONTINUE';

    if (input.riskLevel === 'LOW') {
      summary = 'Journey is progressing normally within standard route and time parameters. No safety anomalies detected.';
      recommendedAction = 'CONTINUE';
    } else if (input.riskLevel === 'MODERATE') {
      summary = 'SafeWalk AI noted an unusual variance in route or travel speed. Safe monitoring continues with heightened awareness.';
      recommendedAction = 'CONTINUE';
    } else if (input.riskLevel === 'HIGH') {
      summary = 'Multiple unusual telemetry signals detected. Initiating a proactive safety check-in to confirm the traveler is secure.';
      recommendedAction = 'CHECK_IN';
    } else {
      summary = 'Critical anomaly pattern identified with unconfirmed user status. Escalating to trusted emergency contacts.';
      recommendedAction = 'NOTIFY_TRUSTED_CONTACT';
    }

    return {
      summary,
      recommendedAction,
      signals,
    };
  }
}

export const aiService = new AiService();
