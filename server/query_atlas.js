if (!(process.env.MONGODB_URI || process.env.DB_URI || process.env.MONGO_URI)) throw new Error('Database environment configuration is required');
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI || process.env.DB_URI || process.env.MONGO_URI).then(async () => {
  const Order = mongoose.model('Order', new mongoose.Schema({}, {strict: false}));
  const orders = await Order.find({ status: { $regex: /cancel/i } }, 'status');
  console.log('Atlas Cancelled Orders:', orders.map(o => o.status));

  const count = await Order.countDocuments();
  console.log('Atlas Total Orders:', count);
  
  process.exit(0);
});
