import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  content: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const ticketSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  messages: [messageSchema]
}, {
  timestamps: true
});

const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
export default Ticket;
