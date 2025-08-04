import multer from 'multer';
import AppError from '../utilis/appError.js';

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/img/users'); // Folder to save files
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1]; // e.g. 'jpeg'
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload only image', 400), false);
  }
};

// Upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 2, // 2MB limit
  },
});

export const uploadUserPhoto = upload.single('photo');

export default upload;
