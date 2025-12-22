import multer from 'multer';
import { storage } from './cloudinary.js';

// File filter
const fileFilter = (req, file, cb) => {
  console.log('=== MULTER FILE FILTER ===');
  console.log('File received:', file.originalname);
  console.log('Mimetype:', file.mimetype);
  
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype) {
    console.log('File type accepted');
    return cb(null, true);
  } else {
    console.log('File type rejected');
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 
  },
  fileFilter: fileFilter
});

console.log('Multer configured with Cloudinary storage');

export default upload;
