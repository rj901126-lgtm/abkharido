import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Coupon from './server/models/Coupon.js';

dotenv.config({ path: path.resolve('./.env') });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    const code = 'FLAT10';
    let coupon = await Coupon.findOne({ code });
    if (!coupon) {
      await Coupon.create({
        code,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minCartValue: 0,
        maxDiscount: 500,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        usageLimit: 100000,
        isActive: true
      });
      console.log('Seeded gamification coupon: FLAT10');
    } else {
      console.log('FLAT10 coupon already exists.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
seed();
