import express from 'express';
import { getUserByUsername, updateUserProfile, registerCreator, getUsers } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register-creator', registerCreator);
router.get('/', protect, admin, getUsers);
router.get('/:username', getUserByUsername);
router.post('/:username/update', protect, updateUserProfile);

export default router;
