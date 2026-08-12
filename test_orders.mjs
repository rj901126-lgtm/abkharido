import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/abkharido');
  const db = mongoose.connection.db;
  const orders = await db.collection('orders').find({ status: { $regex: /cancel/i } }).toArray();
  console.log(`Cancelled orders found: ${orders.length}`);
  if (orders.length > 0) {
    console.log('Statuses:', orders.map(o => o.status));
  }
  process.exit(0);
}

run();
