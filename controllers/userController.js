import User from '../models/userModel.js';
import catchAsync from '../utilis/catchAsync.js';

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
