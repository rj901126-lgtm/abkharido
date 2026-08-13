const mongoose = require('mongoose'); 
const User = require('./server/models/User.js').default; 
const Product = require('./server/models/Product.js').default; 
mongoose.connect('mongodb://127.0.0.1:27017/test').then(async () => { 
  const u = await User.findOne(); 
  const p = await Product.findOne(); 
  await User.updateOne({ _id: u._id }, { $push: { cart: { product: p._id, quantity: 2 } }, $set: { cartUpdatedAt: new Date() } }); 
  const u2 = await User.findById(u._id).lean(); 
  console.log(u2.cart); 
  process.exit(0); 
});
