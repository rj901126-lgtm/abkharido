import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const encryptExistingUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/abkharido');
    console.log('MongoDB Connected for Encryption Migration');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate.`);

    let count = 0;
    for (const user of users) {
      // mongoose-field-encryption plugin automatically encrypts upon save.
      // Simply resaving the document applies the encryption to the targeted fields.
      
      // Check if it's already encrypted by looking for one of the enc fields that the plugin adds
      // (The plugin creates fields like __enc_email, __enc_phone, etc)
      if (user._doc.__enc_email === undefined && user._doc.__enc_phone === undefined) {
        await user.save();
        count++;
      }
    }

    console.log(`Successfully encrypted ${count} existing plain-text user records.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during encryption migration:', error);
    process.exit(1);
  }
};

encryptExistingUsers();
