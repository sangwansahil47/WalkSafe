import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../db/store';
import { AuthenticatedRequest, generateToken } from '../middleware/auth';

export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    if (confirmPassword !== undefined && confirmPassword !== null && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const existingUser = store.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const user = store.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      passwordHash,
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = store.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = bcrypt.compareSync(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const contacts = store.getContactsByUserId(user.id);
    const primaryContact = contacts.find((c) => c.isPrimary);

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        hasPrimaryContact: !!primaryContact,
        primaryContactName: primaryContact?.name,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });

  const contacts = store.getContactsByUserId(req.user.id);
  const primaryContact = contacts.find((c) => c.isPrimary);
  const activeJourney = store.getActiveJourney(req.user.id);

  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      createdAt: req.user.createdAt,
    },
    primaryContact: primaryContact || null,
    totalContacts: contacts.length,
    activeJourney: activeJourney || null,
  });
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });

  const { name, phone } = req.body;
  const updates: any = {};
  if (name && name.trim()) updates.name = name.trim();
  if (phone && phone.trim()) updates.phone = phone.trim();

  const updated = store.updateUser(req.user.id, updates);
  return res.json({
    message: 'Profile updated successfully.',
    user: {
      id: updated!.id,
      name: updated!.name,
      email: updated!.email,
      phone: updated!.phone,
    },
  });
};

export const logout = async (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ message: 'Logged out successfully.' });
};
