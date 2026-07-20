import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'seller', 'admin'],
    default: 'user'
  },
  fullName: { type: String },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String },
  avatar: { type: String, default: 'https://i.pravatar.cc/150' },
  address: { type: String },
  
  // Influencer / Seller fields
  isInfluencer: { type: Boolean, default: false },
  shopName: { type: String },
  walletCash: { type: Number, default: 0 },
  walletCoins: { type: Number, default: 100 },
  payoutDetails: {
    upiId: String,
    bankAccount: String,
    ifsc: String
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
