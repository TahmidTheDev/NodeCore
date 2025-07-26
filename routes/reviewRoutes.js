import express from 'express';
import { protect, restrictTo } from '../controllers/authController.js';
import {
  getallReviews,
  getReview,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
} from '../controllers/reviewController.js';
const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getallReviews)
  .post(restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .delete(restrictTo('user', 'admin'), deleteReview)
  .patch(restrictTo('user', 'admin'), updateReview);

export default router;
