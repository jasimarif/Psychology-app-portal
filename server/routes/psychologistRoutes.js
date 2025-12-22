import express from 'express';
import multer from 'multer';
import {
  createProfile,
  getProfileByUserId,
  updateProfile,
  deleteProfile
} from '../controllers/psychologistController.js';
import upload from '../config/multer.js';
import { verifyToken, checkUserOwnership } from '../middleware/auth.js';

const router = express.Router();

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Error uploading file'
    });
  }
  next();
};

router.post('/', verifyToken, upload.single('profileImage'), handleMulterError, createProfile);
router.get('/:userId', verifyToken, checkUserOwnership, getProfileByUserId);
router.put('/:userId', verifyToken, checkUserOwnership, upload.single('profileImage'), handleMulterError, updateProfile);
router.delete('/:userId', verifyToken, checkUserOwnership, deleteProfile);

export default router;
