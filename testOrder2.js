import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './server/models/Order.js';

dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const mappedShippingAddress = {
      fullName: 'Customer',
      address: 'Not Provided',
      city: 'Not Provided',
      postalCode: '000000',
      country: 'India'
    };

    const order = new Order({
      orderItems: [{
        product: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        image: 'https://via.placeholder.com/150',
        price: 100,
        qty: 1
      }],
      user: new mongoose.Types.ObjectId(),
      shippingAddress: mappedShippingAddress,
      paymentMethod: 'Cash on Delivery',
      itemsPrice: 100,
      taxPrice: 18,
      shippingPrice: 50,
      totalPrice: 168,
      paymentResult: {
        id: '',
        status: 'PENDING'
      }
    });
    
    await order.validate();
    console.log('Order validation SUCCESS!');
  } catch (err) {
    console.error('Validation Error:', err.message);
  } finally {
    mongoose.connection.close();
  }
}
test();
