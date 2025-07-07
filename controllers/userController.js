import User from '../models/userModel.js';
import AppError from '../utilis/appError.js';
import catchAsync from '../utilis/catchAsync.js';

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const getallusers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

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

export const getuser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route not implement',
  });
};

export const createusers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route not implement',
  });
};

export const updateuser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route not implement',
  });
};

export const deleteuser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route not implement',
  });
};
