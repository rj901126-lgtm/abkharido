import express from 'express';
import { 
  createTicket, 
  getMyTickets, 
  getAllTickets, 
  getTicketById, 
  replyTicket, 
  updateTicketStatus 
} from '../controllers/ticketController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { logAdminAction } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Customer Routes
router.route('/')
  .post(protect, createTicket)
  .get(protect, admin, getAllTickets); // Admin gets all

router.route('/my-tickets')
  .get(protect, getMyTickets);

router.route('/:id')
  .get(protect, getTicketById);

router.route('/:id/reply')
  .post(protect, replyTicket);

// Admin Specific Routes
router.route('/:id/status')
  .put(protect, admin, logAdminAction('UPDATE_TICKET_STATUS', 'Ticket'), updateTicketStatus);

export default router;
