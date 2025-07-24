import Review from '../models/reviewModel.js';
import AppError from '../utilis/appError.js';
import catchAsync from '../utilis/catchAsync.js';

export const getallReviews = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

export const createReviews = catchAsync(async (req, res) => {
  // Force user and tour ID from authenticated request, ignore body values
  //   const reviewData = {
  //   ...req.body,
  //   tour: req.params.tourId,
  //   user: req.user.id,
  // };

  // const newReview = await Review.create(reviewData);
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

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
