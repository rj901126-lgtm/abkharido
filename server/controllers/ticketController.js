import Ticket from '../models/Ticket.js';

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private (Customer)
export const createTicket = async (req, res, next) => {
  try {
    const { subject, message, priority, orderId } = req.body;

    const ticket = new Ticket({
      customerId: req.user._id,
      orderId: orderId || null,
      subject,
      priority: priority || 'Medium',
      messages: [
        {
          senderId: req.user._id,
          isAdmin: false,
          content: message
        }
      ]
    });

    const createdTicket = await ticket.save();
    res.status(201).json(createdTicket);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's tickets
// @route   GET /api/tickets/my-tickets
// @access  Private (Customer)
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ customerId: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('orderId', 'createdAt totalPrice status').lean();
      
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tickets (Admin)
// @route   GET /api/tickets
// @access  Private/Admin
export const getAllTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({})
      .sort({ createdAt: -1 })
      .populate('customerId', 'name email')
      .populate('orderId', 'totalPrice').lean();
      
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private (Customer or Admin)
export const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('orderId', 'totalPrice createdAt')
      .populate('messages.senderId', 'name email').lean();

    if (ticket) {
      // Ensure customer only sees their own ticket unless staff/admin
      const isStaffOrAdmin = ['admin', 'super_admin', 'support_agent'].includes(req.user.role);
      if (!isStaffOrAdmin && ticket.customerId._id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this ticket');
      }
      res.json(ticket);
    } else {
      res.status(404);
      throw new Error('Ticket not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to a ticket
// @route   POST /api/tickets/:id/reply
// @access  Private (Customer or Admin)
export const replyTicket = async (req, res, next) => {
  try {
    const { content } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (ticket) {
      // Ensure auth
      const isStaffOrAdmin = ['admin', 'super_admin', 'support_agent'].includes(req.user.role) || req.user.role === 'master_admin_legacy';
      if (!isStaffOrAdmin && ticket.customerId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to reply to this ticket');
      }

      ticket.messages.push({
        senderId: req.user._id,
        isAdmin: isStaffOrAdmin,
        content
      });

      // Update status if replied by admin
      if (isAdmin && ticket.status === 'Open') {
        ticket.status = 'In Progress';
      }

      const updatedTicket = await ticket.save();
      res.status(201).json(updatedTicket);
    } else {
      res.status(404);
      throw new Error('Ticket not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update ticket status (Admin)
// @route   PUT /api/tickets/:id/status
// @access  Private/Admin
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, priority } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (ticket) {
      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;

      const updatedTicket = await ticket.save();
      res.json(updatedTicket);
    } else {
      res.status(404);
      throw new Error('Ticket not found');
    }
  } catch (error) {
    next(error);
  }
};
