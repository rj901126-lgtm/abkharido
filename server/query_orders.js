import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/abkharido').then(async () => {
  const Order = mongoose.model('Order', new mongoose.Schema({}, {strict: false}));
  const orders = await Order.find({ status: { $regex: /cancel/i } });
  console.log('Cancelled orders statuses:', orders.map(o => o.status));
  process.exit(0);
});
