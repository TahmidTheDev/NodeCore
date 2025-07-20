import Review from '../models/reviewModel.js';
import AppError from '../utilis/appError.js';
import catchAsync from '../utilis/catchAsync.js';

export const getallReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

export const createReviews = catchAsync(async (req, res) => {
  const newReview = await Review.create(req.body);

  if (!newReview) {
    throw new AppError('Reviews could not be created', 400);
  }

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});
