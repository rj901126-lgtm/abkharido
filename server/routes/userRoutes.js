import express from 'express';
import { getUserByUsername, updateUserProfile, getUsers, suspendUser, addWalletBalance, updateSellerStatus } from '../controllers/userController.js';
import { protect, admin, softProtect } from '../middleware/authMiddleware.js';
import { logAdminAction } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getUsers);
router.get('/:username', softProtect, getUserByUsername);
router.post('/:username/update', protect, updateUserProfile);

// Enterprise CRM Actions
router.post('/:id/suspend', protect, admin, logAdminAction('SUSPEND_USER', 'User'), suspendUser);
router.post('/:id/wallet', protect, admin, logAdminAction('ADD_WALLET_BALANCE', 'User'), addWalletBalance);

// Enterprise VMS Actions
router.post('/:id/seller-status', protect, admin, logAdminAction('UPDATE_SELLER_STATUS', 'User'), updateSellerStatus);

export default router;
