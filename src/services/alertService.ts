import { api } from './api';
import { SafetyAlert } from '../types';

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

export const alertService = {
  async triggerSOS(data?: { journeyId?: string; latitude?: number; longitude?: number }): Promise<{
    message: string;
    alert: SafetyAlert;
    dispatchResult: DispatchResult;
  }> {
    const url = data?.journeyId ? `/api/journeys/${data.journeyId}/sos` : '/api/alerts/sos';
    const res = await api.post<{
      message: string;
      alert: SafetyAlert;
      dispatchResult: DispatchResult;
    }>(url, {
      latitude: data?.latitude,
      longitude: data?.longitude,
    });
    return res.data;
  },

  async requestHelp(journeyId: string): Promise<{
    message: string;
    alert: SafetyAlert;
    dispatchResult: DispatchResult;
  }> {
    const res = await api.post<{
      message: string;
      alert: SafetyAlert;
      dispatchResult: DispatchResult;
    }>(`/api/journeys/${journeyId}/request-help`);
    return res.data;
  },

  async autoEscalate(journeyId: string): Promise<{
    message: string;
    alert: SafetyAlert;
    dispatchResult: DispatchResult;
  }> {
    const res = await api.post<{
      message: string;
      alert: SafetyAlert;
      dispatchResult: DispatchResult;
    }>(`/api/journeys/${journeyId}/escalate`);
    return res.data;
  },

  async getAlerts(): Promise<SafetyAlert[]> {
    const res = await api.get<{ alerts: SafetyAlert[] }>('/api/alerts');
    return res.data.alerts;
  },

  async getAlertById(id: string): Promise<SafetyAlert> {
    const res = await api.get<{ alert: SafetyAlert }>(`/api/alerts/${id}`);
    return res.data.alert;
  },
};
