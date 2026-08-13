const mongoose = require('mongoose');
const Order = require('./server/models/Order.js').default;
const User = require('./server/models/User.js').default;

mongoose.connect('mongodb://127.0.0.1:27017/test').then(async () => {
  try {
    const user = await User.findOne();
    if (!user) { console.log('No user'); return process.exit(0); }
    let query = { user: user._id };
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(0).limit(20).lean();
    console.log('Orders found:', orders.length);
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  process.exit(0);
});
