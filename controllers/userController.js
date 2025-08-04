import sharp from 'sharp';
import User from '../models/userModel.js';
import AppError from '../utilis/appError.js';
import catchAsync from '../utilis/catchAsync.js';
import { deleteOne, updateOne, getOne, getAll } from './handlerFactory.js';

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Custom filename
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const updateMe = catchAsync(async (req, res, next) => {
  //if user post password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2. Filter fields allowed to be updated
  const filterBody = filterObj(req.body, 'name', 'email');
  if (req.file) filterBody.photo = req.file.filename;
  //2. Update user document
  const updateUser = await User.findByIdAndUpdate(req.user?.id, filterBody, {
    new: true,
    runValidators: true,
  });

  if (!updateUser) {
    return next(new AppError('User not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser,
    },
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const createusers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route not implement please use signup instead',
  });
};

export const getuser = getOne(User);
export const getallusers = getAll(User);
//do not update password with this update
export const updateuser = updateOne(User);
export const deleteUser = deleteOne(User);
