import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { promisify } from 'util';
import AppError from '../utilis/appError.js';
import sendEmail from '../utilis/email.js';
import catchAsync from '../utilis/catchAsync.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),

    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const signUp = catchAsync(async (req, res, next) => {
  // 2. Create user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  // 3. Defensive check (optional if mongoose throws on fail)
  if (!newUser) {
    return next(new AppError('User could not be created', 400));
  }

  // 4. Generate token
  // const token = signToken(newUser._id);

  //5. Remove password from output (important!)
  // newUser.password = undefined;

  // 6. Respond
  createSendToken(newUser, 201, res);
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select(
    '+password +loginAttempts +lockUntil +failedRounds'
  );

  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const now = Date.now();

  // If user is currently locked
  if (user.lockUntil && user.lockUntil > now) {
    const waitTime = Math.ceil((user.lockUntil - now) / 1000);
    return next(
      new AppError(
        `Too many login attempts. Try again in ${waitTime} seconds.`,
        429
      )
    );
  }

  // If lock expired, reset attempts (not failedRounds!)
  if (user.lockUntil && user.lockUntil < now) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });
  }

  // Check password correctness
  const isCorrect = await user.correctPassword(password, user.password);

  if (!isCorrect) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= 3) {
      user.failedRounds += 1;

      const delay = Math.min(
        Math.pow(2, user.failedRounds - 1) * 60 * 1000, // exponential backoff
        60 * 60 * 1000 // max 1 hour
      );
      user.lockUntil = now + delay;
      user.loginAttempts = 0; // reset attempts after locking
    }

    await user.save({ validateBeforeSave: false });

    return next(new AppError('Incorrect email or password', 401));
  }

  // On successful login, reset attempts and lock info
  user.loginAttempts = 0;
  user.failedRounds = 0;
  user.lockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  // Issue JWT token and send response
  createSendToken(user, 200, res);
});

export const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Check for token in header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in.', 401));
  }
  // 2. Verify token
  let decoded;
  decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3.Check if user still exits
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user no longer exists.', 401));
  }

  //.check if password was chnaged after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password recently changed. Please log in again.', 401)
    );
  }
  // 5. Grant access
  req.user = currentUser;

  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return next(new AppError('Unauthorized: No user found', 401));
    }

    if (!roles.includes(user.role)) {
      return next(
        new AppError('Forbidden you do not have permission to access this', 403)
      );
    }
    next();
  };
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  //req.body can be undefined and cause runtime error

  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body?.email });

  if (!user) {
    return next(new AppError('No user found with that email', 404));
  }
  // 2) Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) send it to user email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `foregt password? click on this ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset token for 10 min',
      message,
    });

    createSendToken(user, 200, res);
    // res.status(200).json({
    //   status: 'success',
    //   message: 'token sent to eamil',
    // });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('there was an error', 500));
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  // 1)Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  //set new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // clear reset token field
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //update
  await user.save();

  // 2)if token has not expired and there is user, set new password
  // 3)Update chnagedPassword at property for user
  // 4)Log the user in, send jwt
  // const token = signToken(user._id);

  createSendToken(user, 200, res);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  //   message: 'Password has been reset successfully',
  // });
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current Password is wrong', 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // const token = signToken(user._id);
  createSendToken(user, 200, res);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});
