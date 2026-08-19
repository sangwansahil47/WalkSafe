import { Router } from 'express';
import {
  createJourney,
  getActiveJourney,
  getJourneys,
  getJourneyById,
  recordLocation,
  checkIn,
  endJourney,
  simulateEvent,
} from '../controllers/journeyController';
import { triggerSOS, requestHelp, autoEscalate } from '../controllers/alertController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', createJourney);
router.get('/', getJourneys);
router.get('/active', getActiveJourney);
router.get('/:id', getJourneyById);
router.post('/:id/location', recordLocation);
router.post('/:id/check-in', checkIn);
router.post('/:id/end', endJourney);
router.post('/:id/simulate-event', simulateEvent);
router.post('/:id/sos', triggerSOS);
router.post('/:id/request-help', requestHelp);
router.post('/:id/escalate', autoEscalate);

export default router;
