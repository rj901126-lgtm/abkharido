const mongoose = require('mongoose');
const User = require('./server/models/User.js').default;
const Product = require('./server/models/Product.js').default;

mongoose.connect('mongodb://127.0.0.1:27017/test').then(async () => {
  try {
    const u = await User.create({ username: 'testu2', email: 'testu2@x.com', password: '123' });
    const p = await Product.create({ id: 'p2', name: 'p2', price: 10, images: [''] });
    await User.updateOne(
      { _id: u._id },
      { $push: { cart: { product: p._id, quantity: 2 } }, $set: { cartUpdatedAt: new Date() } }
    );
    const u2 = await User.findById(u._id).lean();
    console.log('Cart length:', u2.cart.length);
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  process.exit(0);
});
