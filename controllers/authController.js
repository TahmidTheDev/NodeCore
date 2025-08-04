import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { promisify } from 'util';
import AppError from '../utilis/appError.js';
import sendEmail from '../utilis/email.js';
import catchAsync from '../utilis/catchAsync.js';

// Generate a JWT token
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// Send token via cookie and response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // prevents access via client-side JS
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; // Remove password before sending

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Sign up new user
export const signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  if (!newUser) {
    return next(new AppError('User could not be created', 400));
  }

  createSendToken(newUser, 201, res);
});

// Log in user with password check and lockout logic
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

  // User temporarily locked out
  if (user.lockUntil && user.lockUntil > now) {
    const waitTime = Math.ceil((user.lockUntil - now) / 1000);
    return next(
      new AppError(
        `Too many login attempts. Try again in ${waitTime} seconds.`,
        429
      )
    );
  }

  // Lock expired, reset counters
  if (user.lockUntil && user.lockUntil < now) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });
  }

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
      user.loginAttempts = 0;
    }

    await user.save({ validateBeforeSave: false });
    return next(new AppError('Incorrect email or password', 401));
  }

  // Login successful: reset lockout fields
  user.loginAttempts = 0;
  user.failedRounds = 0;
  user.lockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

// Middleware to protect routes (JWT verification)
export const protect = catchAsync(async (req, res, next) => {
  let token;

  // Get token from headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in.', 401));
  }

  // Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user no longer exists.', 401));
  }

  // Check if password changed after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password recently changed. Please log in again.', 401)
    );
  }

  req.user = currentUser;
  next();
});

// Restrict access to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return next(new AppError('Unauthorized: No user found', 401));
    }

    if (!roles.includes(user.role)) {
      return next(
        new AppError(
          'Forbidden: You do not have permission to access this',
          403
        )
      );
    }

    next();
  };
};

// Forgot password: generate reset token and send email
export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body?.email });

  if (!user) {
    return next(new AppError('No user found with that email', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Click here to reset: ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });

    createSendToken(user, 200, res);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email.', 500));
  }
});

// Reset password via reset token
export const resetPassword = catchAsync(async (req, res, next) => {
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

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createSendToken(user, 200, res);
});

// Authenticated user updates their password
export const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  const isCorrect = await user.correctPassword(
    req.body.currentPassword,
    user.password
  );

  if (!isCorrect) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  createSendToken(user, 200, res);
});
