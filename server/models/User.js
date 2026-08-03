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
  email: { type: String, unique: true, sparse: true },
  isEmailVerified: { type: Boolean, default: false },
  phone: { type: String },
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    }
  }],
  cartUpdatedAt: { type: Date }
}, {
  timestamps: true
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

// Add Field-Level Encryption Plugin
userSchema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['phone', 'email', 'address', 'houseNo', 'streetArea', 'city', 'pincode', 'state', 'payoutDetails'],
  secret: process.env.DATABASE_ENCRYPTION_KEY || 'abkharido_default_master_encryption_key_2026_super_secure',
  saltGenerator: function (secret) {
    return "1234567890123456"; // 16 byte static salt for deterministic encryption if needed, or let plugin handle it (if omitted, default is random salt per field, but mongoose-field-encryption defaults to random salt unless specified). Actually, omitting it is fine.
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
