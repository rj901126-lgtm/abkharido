import express from 'express';
import { authUser, registerUser, getUserProfile, sendOtp, verifyOtp, verifyFirebase, checkUser, logoutUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.post('/logout', protect, logoutUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/verify-firebase', verifyFirebase);
router.post('/check-user', checkUser);

export default router;
