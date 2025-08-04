import express from 'express';
import { uploadUserPhoto } from '../controllers/upload.js';
import {
  getallusers,
  createusers,
  getuser,
  updateuser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  resizeUserPhoto,
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

//from here all route will use protect
router.use(protect);

router.patch('/updateMyPassword', updatePassword);

router.get('/me', getMe, getuser);

router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

//from here only admin can use this routes
router.use(restrictTo('admin'));

router.route('/').get(getallusers).post(createusers);

router.route('/:id').get(getuser).patch(updateuser).delete(deleteUser);

export default router;
