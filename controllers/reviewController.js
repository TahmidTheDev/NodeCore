import Review from '../models/reviewModel.js';
import AppError from '../utilis/appError.js';
import catchAsync from '../utilis/catchAsync.js';
import {
  getAll,
  deleteOne,
  updateOne,
  createOne,
  getOne,
} from './handlerFactory.js';

export const setTourUserIds = (req, res, next) => {
  // Force user and tour ID from authenticated request, ignore body values
  //   const reviewData = {
  //   ...req.body,
  //   tour: req.params.tourId,
  //   user: req.user.id,
  // };

  // const newReview = await Review.create(reviewData);

  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

export const getallReviews = getAll(Review);
export const getReview = getOne(Review);
export const createReview = createOne(Review);
export const deleteReview = deleteOne(Review);
export const updateReview = updateOne(Review);
