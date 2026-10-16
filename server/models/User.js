import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import mongooseFieldEncryption from 'mongoose-field-encryption';
import { isActiveUser, isGeneratedPassword } from '../utils/authSecurity.js';

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
    enum: ['user', 'seller', 'admin', 'super_admin', 'support_agent', 'catalog_manager'],
    default: 'user'
  },
  fullName: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, unique: true, sparse: true, index: true, lowercase: true, trim: true },
  isEmailVerified: { type: Boolean, default: false },
  phone: { type: String, unique: true, sparse: true, index: true, trim: true },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  sellerStatus: { type: String, enum: ['None', 'Pending', 'Approved', 'Rejected'], default: 'None' },
  avatar: { type: String, default: 'https://i.pravatar.cc/150' },
  address: { type: String },
  houseNo: { type: String },
  streetArea: { type: String },
  city: { type: String },
  pincode: { type: String },
  state: { type: String },
  addressType: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
  
  // Address Book
  addresses: [{
    id: { type: String },
    name: { type: String },
    phone: { type: String },
    houseNo: { type: String },
    streetArea: { type: String },
    city: { type: String },
    pincode: { type: String },
    state: { type: String },
    addressType: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
    isDefault: { type: Boolean, default: false }
  }],
  
  // Seller fields & Compliance (GST / Non-GST Scheme)
  shopName: { type: String },
  sellerType: { type: String, enum: ['gst', 'non_gst', 'composition'], default: 'non_gst' },
  gstin: { type: String, trim: true, uppercase: true },
  pan: { type: String, trim: true, uppercase: true },
  enrolmentId: { type: String, trim: true },
  udyamNumber: { type: String, trim: true, uppercase: true },
  documents: {
    panCardUrl: { type: String },
    bankProofUrl: { type: String },
    udyamCertUrl: { type: String }
  },
  legalBusinessName: { type: String, trim: true },
  turnoverCertified: { type: Boolean, default: true },
  commissionRate: { type: Number, default: 0.08 },
  pickupAddress: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    phone: { type: String }
  },
  walletCoins: { type: Number, default: 100 },
  walletCash: { type: Number, default: 0 },
  payoutDetails: {
    upiId: String,
    bankAccount: String,
    ifsc: String,
    accountHolderName: String,
    bankName: String,
    verified: { type: Boolean, default: true }
  },
  
  // Cross-device synced cart
  cart: [{
    product: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    }
  }],
  cartUpdatedAt: { type: Date },
  
  // Cross-device synced wishlist
  wishlist: [{
    type: mongoose.Schema.Types.Mixed
  }],

  // Privacy-Safe Unique Referral & Influencer Tracking
  referralCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
  referredBy: { type: String, uppercase: true, trim: true },
  referralStats: {
    clicks: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Pre-save hook to normalize phone & email and handle empty strings for sparse unique indexes
userSchema.pre('save', function() {
  if (this.email !== undefined) {
    if (this.email) {
      const e = this.email.trim().toLowerCase();
      // Reject legacy hex ciphertexts, colons, dummy placeholder domains, or malformed strings
      if (
        !e.includes('@') || 
        !e.includes('.') || 
        e.includes(':') || 
        e.startsWith('313233') || 
        /^[0-9a-fA-F]{24,}$/.test(e) ||
        (e.endsWith('@abkharido.com') && !['admin@abkharido.com', 'support@abkharido.com', 'care@abkharido.com', 'wholesale@abkharido.com'].includes(e)) ||
        !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e)
      ) {
        this.email = undefined;
      } else {
        this.email = e;
      }
    } else {
      this.email = undefined;
    }
  }
  if (this.phone !== undefined) {
    if (this.phone) {
      let p = this.phone.toString().replace(/\s/g, '').replace(/-/g, '');
      if (p.startsWith('+91')) p = p.slice(3);
      else if (p.startsWith('91') && p.length === 12) p = p.slice(2);
      this.phone = p || undefined;
    } else {
      this.phone = undefined;
    }
  }

  // Ensure every user gets an opaque unique referral code (never a phone number)
  if (!this.referralCode || /^\d{10,12}$/.test(this.referralCode)) {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'AK-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.referralCode = code;
  }
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!isActiveUser(this) || isGeneratedPassword(enteredPassword)) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add Field-Level Encryption Plugin for sensitive payout details
userSchema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['payoutDetails'],
  secret: process.env.DATABASE_ENCRYPTION_KEY || 'abkharido_default_master_encryption_key_2026_super_secure',
  saltGenerator: function (secret) {
    return process.env.DATABASE_ENCRYPTION_SALT || "1234567890123456";
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
