import { Router } from 'express';
import { getContacts, createContact, updateContact, deleteContact } from '../controllers/contactController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getContacts);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
