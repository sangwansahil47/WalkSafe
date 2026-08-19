import { api } from './api';
import { Journey, LocationLog, LocationPoint, RiskAnalysis } from '../types';

export const journeyService = {
  async createJourney(data: {
    startLocation: LocationPoint;
    destination: LocationPoint;
    expectedDuration: number;
  }): Promise<Journey> {
    const res = await api.post<{ message: string; journey: Journey }>('/api/journeys', data);
    return res.data.journey;
  },

  async getActiveJourney(): Promise<{ journey: Journey | null; locationLogs: LocationLog[] }> {
    const res = await api.get<{ journey: Journey | null; locationLogs: LocationLog[] }>('/api/journeys/active');
    return res.data;
  },

  async getJourneys(): Promise<Journey[]> {
    const res = await api.get<{ journeys: Journey[] }>('/api/journeys');
    return res.data.journeys;
  },

  async getJourneyById(id: string): Promise<{ journey: Journey; locationLogs: LocationLog[] }> {
    const res = await api.get<{ journey: Journey; locationLogs: LocationLog[] }>(`/api/journeys/${id}`);
    return res.data;
  },

  async recordLocation(
    id: string,
    data: { latitude: number; longitude: number; speed?: number }
  ): Promise<{ journey: Journey; riskAnalysis: RiskAnalysis; locationLogs: LocationLog[] }> {
    const res = await api.post<{ journey: Journey; riskAnalysis: RiskAnalysis; locationLogs: LocationLog[] }>(
      `/api/journeys/${id}/location`,
      data
    );
    return res.data;
  },

  async checkIn(id: string): Promise<Journey> {
    const res = await api.post<{ message: string; journey: Journey }>(`/api/journeys/${id}/check-in`);
    return res.data.journey;
  },

  async endJourney(id: string, status: 'COMPLETED' | 'CANCELLED' = 'COMPLETED'): Promise<Journey> {
    const res = await api.post<{ message: string; journey: Journey }>(`/api/journeys/${id}/end`, { status });
    return res.data.journey;
  },

  async simulateEvent(
    id: string,
    eventType: 'NORMAL' | 'ROUTE_DEVIATION' | 'INACTIVITY' | 'MISSED_CHECKIN' | 'HIGH_RISK'
  ): Promise<{ journey: Journey; riskAnalysis: RiskAnalysis; locationLogs: LocationLog[] }> {
    const res = await api.post<{ journey: Journey; riskAnalysis: RiskAnalysis; locationLogs: LocationLog[] }>(
      `/api/journeys/${id}/simulate-event`,
      { eventType }
    );
    return res.data;
  },
};
