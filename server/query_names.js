import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/abkharido').then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}));
  console.log(await Product.find({name: {$exists: false}}).countDocuments());
  process.exit(0);
});
