import jwt from 'jsonwebtoken';
import fetch from 'node-fetch'; // assuming it's available, otherwise native fetch

import mongoose from 'mongoose';
import User from './server/models/User.js';

async function run() {
  await mongoose.connect('mongodb+srv://abkharido_admin:Enterprise2026@cluster0.asrwdhy.mongodb.net/abkharido?retryWrites=true&w=majority');
  const user = await User.findOne();
  if (!user) return console.log('No users found');
  
  const token = jwt.sign({ id: user._id }, 'abkharido_jwt_secret_dev', { expiresIn: '30d' });

  async function testCartSync() {
    console.log('Testing /api/cart/sync...');
    try {
      const res = await fetch('http://localhost:5000/api/cart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      body: JSON.stringify({
        cart: [{ product: { id: '60d0fe4f5311236168a109cb', price: 100 }, quantity: 1 }]
      })
    });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  } catch (err) {
    console.error(err);
  }
}

  async function testPlaceOrder() {
    console.log('Testing /api/orders...');
    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cart: [{ product: { id: '60d0fe4f5311236168a109cb', price: 100 }, quantity: 1 }],
          shippingAddress: {},
          paymentMethod: 'Cashfree'
        })
      });
      console.log('Status:', res.status);
      console.log('Body:', await res.text());
    } catch (err) {
      console.error(err);
    }
  }

  await testCartSync();
  await testPlaceOrder();
  process.exit(0);
}
run();
