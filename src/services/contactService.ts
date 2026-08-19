import { api } from './api';
import { EmergencyContact } from '../types';

export const contactService = {
  async getContacts(): Promise<EmergencyContact[]> {
    const res = await api.get<{ contacts: EmergencyContact[] }>('/api/contacts');
    return res.data.contacts;
  },

  async createContact(data: {
    name: string;
    email: string;
    phone: string;
    relationship?: string;
    isPrimary?: boolean;
  }): Promise<EmergencyContact> {
    const res = await api.post<{ message: string; contact: EmergencyContact }>('/api/contacts', data);
    return res.data.contact;
  },

  async updateContact(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      relationship?: string;
      isPrimary?: boolean;
    }
  ): Promise<EmergencyContact> {
    const res = await api.put<{ message: string; contact: EmergencyContact }>(`/api/contacts/${id}`, data);
    return res.data.contact;
  },

  async deleteContact(id: string): Promise<void> {
    await api.delete(`/api/contacts/${id}`);
  },
};
