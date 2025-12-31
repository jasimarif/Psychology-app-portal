import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getAllPsychologists,
  getAllBookings,
  getAllUsers,
  getAdminStats,
  getUserBookings,
  togglePsychologistStatus
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/stats', verifyToken, getAdminStats);
router.get('/psychologists', verifyToken, getAllPsychologists);
router.get('/bookings', verifyToken, getAllBookings);
router.get('/users', verifyToken, getAllUsers);
router.get('/users/:userId/bookings', verifyToken, getUserBookings);
router.patch('/psychologists/:psychologistId/status', verifyToken, togglePsychologistStatus);

export default router;
