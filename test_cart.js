import mongoose from 'mongoose';
import User from './server/models/User.js';
import Product from './server/models/Product.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const email = "test_user_cart@example.com";
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      name: "Cart Tester",
      email: email,
      password: "password123",
      username: "cart_tester"
    });
    await user.save();
    console.log("Created test user");
  } else {
    user.cart = [];
    await user.save();
    console.log("Cleared test user cart");
  }

  // Get some product slugs
  const products = await Product.find().limit(3).lean();
  console.log("Products available:", products.map(p => p.id));

  // Simulate Request 1 (Device A adds product 1)
  const req1 = {
    body: {
      action: 'add',
      item: { product: products[0].id, quantity: 1 }
    },
    user: { _id: user._id }
  };
  
  // Simulate Request 2 (Device B adds product 2)
  const req2 = {
    body: {
      action: 'add',
      item: { product: products[1].id, quantity: 1 }
    },
    user: { _id: user._id }
  };

  // We need to call syncCart but mock req and res
  const resMock = {
    status: (code) => console.log("Status:", code),
    json: (data) => console.log("Response JSON Cart Length:", data.cart ? data.cart.length : "N/A")
  };

  const nextMock = (err) => console.log("Next Error:", err);

  const { syncCart } = await import('./server/controllers/cartController.js');

  console.log("--- Executing Req 1 ---");
  await syncCart(req1, resMock, nextMock);

  console.log("--- Executing Req 2 ---");
  await syncCart(req2, resMock, nextMock);

  const finalUser = await User.findById(user._id);
  console.log("Final DB Cart Length:", finalUser.cart.length);
  
  process.exit(0);
}

test().catch(console.error);
