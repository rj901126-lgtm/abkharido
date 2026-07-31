import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const orderSchema = new mongoose.Schema({
  status: String,
});
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const total = await Order.countDocuments();
    const live = await Order.countDocuments({ status: { $nin: ['Delivered', 'Cancelled'] } });
    const statuses = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    console.log("Total Orders:", total);
    console.log("Live Orders:", live);
    console.log("Statuses:", JSON.stringify(statuses));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
check();
