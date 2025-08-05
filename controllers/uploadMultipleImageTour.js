import multer from 'multer';
import AppError from '../utilis/appError.js';

// Store uploaded files in memory
const multerStorage = multer.memoryStorage();

// Accept image files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload only images.', 400), false);
  }
};

// Upload middleware configuration
const upload = multer({
  storage: multerStorage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 2, // 2MB per image
  },
});

// Upload middleware for multiple fields
export const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 2 },
  { name: 'images', maxCount: 3 },
]);
export const uploadUserPhoto = upload.single('photo');

export default upload;
