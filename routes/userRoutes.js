import express from 'express';
import {
  getallusers,
  createusers,
  getuser,
  updateuser,
  deleteuser,
  updateMe,
  deleteMe,
} from '../controllers/userController.js';
import {
  signUp,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.patch('/updateMyPassword', protect, updatePassword);

router.patch('/updateMe', protect, updateMe);
router.delete('/deleteMe', protect, deleteMe);

router.route('/').get(getallusers).post(createusers);

router.route('/:id').get(getuser).patch(updateuser).delete(deleteuser);

export default router;
