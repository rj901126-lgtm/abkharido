import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/abkharido';

async function fixUsernames() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Checking for user accounts with random trailing numbers...');

    const users = await User.find({ role: { $ne: 'admin' } });
    let fixedCount = 0;

    for (let u of users) {
      // Case 1: Phone number exists and username has trailing random digits
      if (u.phone) {
        const cleanPhone = u.phone.replace(/\D/g, '');
        if (u.username !== cleanPhone && cleanPhone.length >= 10 && u.username.startsWith(cleanPhone)) {
          console.log(`Fixing username for ${u.fullName || 'User'}: ${u.username} -> ${cleanPhone}`);
          u.username = cleanPhone;
          await u.save();
          fixedCount++;
        }
      } 
      // Case 2: Username is 13 digits (10 digit mobile + 3 random digits) like 9172600587926
      else if (/^\d{13}$/.test(u.username)) {
        const cleanPhone = u.username.slice(0, 10);
        console.log(`Fixing mobile username artifact: ${u.username} -> ${cleanPhone}`);
        u.username = cleanPhone;
        if (!u.phone) u.phone = cleanPhone;
        await u.save();
        fixedCount++;
      }
    }

    console.log(`Successfully fixed ${fixedCount} user account(s) to pure mobile numbers!`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing usernames:', error);
    process.exit(1);
  }
}

fixUsernames();
