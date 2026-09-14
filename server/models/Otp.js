import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // 5 minutes TTL index
  }
});

// Hash OTP before saving
otpSchema.pre('save', async function() {
  if (!this.isModified('otp')) return;
  const salt = await bcrypt.genSalt(10);
  this.otp = await bcrypt.hash(this.otp, salt);
});

// Strictly verify OTP using bcrypt hash with max 5 attempts limit
otpSchema.methods.matchOtp = async function(enteredOtp) {
  if (!enteredOtp) return false;
  
  // Rate limit: Max 5 failed attempts per OTP record
  if (this.attempts >= 5) {
    return false;
  }

  this.attempts = (this.attempts || 0) + 1;
  await this.save().catch(() => {});

  try {
    return await bcrypt.compare(String(enteredOtp), this.otp);
  } catch (e) {
    return false;
  }
};

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
export default Otp;
