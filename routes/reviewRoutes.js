import express from 'express';
import { protect, restrictTo } from '../controllers/authController.js';
import {
  getallReviews,
  createReviews,
} from '../controllers/reviewController.js';
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getallReviews)
  .post(protect, restrictTo('user'), createReviews);

export default router;
