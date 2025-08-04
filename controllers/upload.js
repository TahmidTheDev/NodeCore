import multer from 'multer';
import AppError from '../utilis/appError.js';

// Store uploaded file in memory
const multerStorage = multer.memoryStorage();

// Accept image files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload only image', 400), false);
  }
};

// Upload middleware
const upload = multer({
  storage: multerStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 2, // 2MB limit
  },
});

export const uploadUserPhoto = upload.single('photo');

export default upload;
