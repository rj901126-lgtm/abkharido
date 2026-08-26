import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import mongooseFieldEncryption from 'mongoose-field-encryption';

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
  
  // Seller fields
  shopName: { type: String },
  walletCoins: { type: Number, default: 100 },
  payoutDetails: {
    upiId: String,
    bankAccount: String,
    ifsc: String
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
  }]
}, {
  timestamps: true
});

// Pre-save hook to normalize phone & email and handle empty strings for sparse unique indexes
userSchema.pre('save', function() {
  if (this.email !== undefined) {
    this.email = this.email ? this.email.trim().toLowerCase() : undefined;
    if (this.email === '') this.email = undefined;
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
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add Field-Level Encryption Plugin for sensitive payout details
userSchema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['payoutDetails'],
  secret: process.env.DATABASE_ENCRYPTION_KEY || 'abkharido_default_master_encryption_key_2026_super_secure',
  saltGenerator: function (secret) {
    return "1234567890123456";
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
