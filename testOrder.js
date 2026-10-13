import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import User from './server/models/User.js';
import Product from './server/models/Product.js';

async function run() {
  try {
    if (!process.env.JWT_SECRET || !(process.env.MONGODB_URI || process.env.DB_URI || process.env.MONGO_URI)) throw new Error('Database and JWT environment configuration is required');
    await mongoose.connect(process.env.MONGODB_URI || process.env.DB_URI || process.env.MONGO_URI, {
      family: 4
    });
    
    const user = await User.findOne();
    if (!user) throw new Error('No user found');
    
    let product = await Product.findOne();
    if (!product) {
      product = await Product.create({
        name: 'Test Product',
        price: 500,
        description: 'Test',
        category: 'Test'
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    console.log('Sending Order Request...');
    const res = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cart: [{ product: { id: product._id, name: product.name, price: product.price }, quantity: 1 }],
        shippingAddress: { address: 'Test', city: 'Test', postalCode: '123', country: 'Test' },
        paymentMethod: 'Cashfree',
        cfOrderId: 'test_order_123'
      })
    });
    
    console.log('Status:', res.status);
    console.log('Order request completed');
  } catch (err) {
    console.error('Order request failed');
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}
run();
