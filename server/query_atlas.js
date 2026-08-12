import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://admin:Abkharido123@cluster0.asrwdhy.mongodb.net/abkharido?appName=Cluster0').then(async () => {
  const Order = mongoose.model('Order', new mongoose.Schema({}, {strict: false}));
  const orders = await Order.find({ status: { $regex: /cancel/i } }, 'status');
  console.log('Atlas Cancelled Orders:', orders.map(o => o.status));

  const count = await Order.countDocuments();
  console.log('Atlas Total Orders:', count);
  
  process.exit(0);
});
