const mongoose = require('mongoose');
const User = require('./server/models/User.js').default;
const Product = require('./server/models/Product.js').default;

mongoose.connect('mongodb://127.0.0.1:27017/test').then(async () => {
  try {
    let u = await User.findOne({ username: 'testu2' });
    if (!u) {
      u = await User.create({ username: 'testu2', email: 'testu2@x.com', password: '123' });
    }
    const p = await Product.findOne();
    
    // Simulate wishlistController.js
    u.wishlist.push(p._id.toString());
    await User.updateOne({ _id: u._id }, { $set: { wishlist: u.wishlist } });
    
    console.log('Wishlist updated successfully');
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  process.exit(0);
});
