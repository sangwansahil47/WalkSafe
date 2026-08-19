import { Response } from 'express';
import { store } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';

export const getContacts = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const contacts = store.getContactsByUserId(req.user.id);
  return res.json({ contacts });
};

export const createContact = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { name, email, phone, relationship, isPrimary } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Contact name is required.' });
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'A valid email is required.' });
  if (!phone || phone.trim().length < 7) return res.status(400).json({ error: 'A valid phone number is required.' });

  const newContact = store.createContact(req.user.id, {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    relationship: relationship?.trim() || 'Trusted Contact',
    isPrimary: !!isPrimary,
  });

  return res.status(201).json({
    message: 'Emergency contact added successfully.',
    contact: newContact,
  });
};

export const updateContact = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params;
  const { name, email, phone, relationship, isPrimary } = req.body;

  const updated = store.updateContact(id, req.user.id, {
    name: name?.trim(),
    email: email?.trim()?.toLowerCase(),
    phone: phone?.trim(),
    relationship: relationship?.trim(),
    isPrimary: isPrimary !== undefined ? !!isPrimary : undefined,
  });

  if (!updated) {
    return res.status(404).json({ error: 'Emergency contact not found.' });
  }

  return res.json({
    message: 'Emergency contact updated.',
    contact: updated,
  });
};

export const deleteContact = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params;
  const deleted = store.deleteContact(id, req.user.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Emergency contact not found.' });
  }

  return res.json({ message: 'Emergency contact deleted successfully.' });
};
