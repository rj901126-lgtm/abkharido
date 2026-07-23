import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import User from './server/models/User.js';
import Product from './server/models/Product.js';

async function run() {
  try {
    await mongoose.connect('mongodb+srv://abkharido_admin:Enterprise2026@cluster0.asrwdhy.mongodb.net/abkharido?retryWrites=true&w=majority', {
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

    const token = jwt.sign({ id: user._id }, 'abkharido_jwt_secret_dev', { expiresIn: '30d' });

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
    console.log('Body:', await res.text());
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}
run();
