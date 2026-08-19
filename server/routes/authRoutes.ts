import { Router } from 'express';
import { register, login, getMe, updateProfile, logout } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);
router.post('/logout', requireAuth, logout);

export default router;
