import express from 'express';
import { getStaff, addStaff, updateStaff } from '../controllers/staffController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { logAdminAction } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Only Super Admins can manage Staff
router.route('/')
  .get(protect, authorizeRoles('super_admin'), getStaff)
  .post(protect, authorizeRoles('super_admin'), logAdminAction('ADD_STAFF', 'User'), addStaff);

router.route('/:id')
  .put(protect, authorizeRoles('super_admin'), logAdminAction('UPDATE_STAFF', 'User'), updateStaff);

export default router;
