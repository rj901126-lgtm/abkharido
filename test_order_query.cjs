const mongoose = require('mongoose');
const Order = require('./server/models/Order.js').default;

mongoose.connect('mongodb://127.0.0.1:27017/test').then(async () => {
  try {
    const orders = await Order.find({ status: { $regex: /^cancelled$/i } });
    console.log('Success:', orders.length);
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  process.exit(0);
});
