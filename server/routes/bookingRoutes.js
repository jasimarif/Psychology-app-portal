import express from 'express';
import {
  getPsychologistBookings,
  cancelBooking,
  confirmBooking
} from '../controllers/bookingController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Protected routes - require authentication
router.get('/psychologist/:psychologistId', verifyToken, getPsychologistBookings);
router.patch('/:bookingId/cancel', verifyToken, cancelBooking);
router.patch('/:bookingId/confirm', verifyToken, confirmBooking);

export default router;
