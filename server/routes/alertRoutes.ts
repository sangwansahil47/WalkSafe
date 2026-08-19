import { Router } from 'express';
import { getAlerts, getAlertById, triggerSOS } from '../controllers/alertController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.post('/sos', triggerSOS);

export default router;
