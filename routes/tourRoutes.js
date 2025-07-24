import express from 'express';

import {
  getAllTours,
  getTour,
  createtour,
  updatetour,
  deletetour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} from '../controllers/tourController.js';
import { protect, restrictTo } from '../controllers/authController.js';
import reviewRoutes from '../routes/reviewRoutes.js';
const router = express.Router();

// router.param('id', checkId);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);

router.route('/').get(protect, getAllTours).post(createtour);

router
  .route('/:id')
  .get(getTour)
  .patch(updatetour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deletetour);

router.use('/:tourId/reviews', reviewRoutes);

export default router;
