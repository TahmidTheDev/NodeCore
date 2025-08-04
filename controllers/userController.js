// Import dependencies and utilities
import sharp from 'sharp';
import User from '../models/userModel.js';
import AppError from '../utilis/appError.js';
import catchAsync from '../utilis/catchAsync.js';
import { deleteOne, updateOne, getOne, getAll } from './handlerFactory.js';

/**
 * Utility function to filter only allowed fields from request body
 */
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

/**
 * Middleware to resize user photo using sharp
 */
export const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Create custom filename
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // Resize and convert to JPEG
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

/**
 * Middleware to set user ID for current authenticated user
 */
export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

/**
 * Controller to update currently logged-in user (excluding password updates)
 */
export const updateMe = catchAsync(async (req, res, next) => {
  // Reject if password fields are in request
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // Filter only allowed fields
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // Update user in database
  const updatedUser = await User.findByIdAndUpdate(req.user?.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    return next(new AppError('User not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

/**
 * Controller to deactivate (soft-delete) current user
 */
export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * Placeholder route for creating users (not implemented)
 */
export const createusers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route not implemented. Please use signup instead.',
  });
};

// Factory methods for generic CRUD operations
export const getuser = getOne(User);
export const getallusers = getAll(User);
export const updateuser = updateOne(User); // Do not use for password updates
export const deleteUser = deleteOne(User);
