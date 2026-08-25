import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // TTL index: Automatically deleted after 5 minutes (300 seconds)
  }
});

// Hash OTP before saving
otpSchema.pre('save', async function() {
  if (!this.isModified('otp')) return;
  const salt = await bcrypt.genSalt(10);
  this.otp = await bcrypt.hash(this.otp, salt);
});

// Match OTP method (supports both bcrypt hash and direct string match)
otpSchema.methods.matchOtp = async function(enteredOtp) {
  if (String(this.otp) === String(enteredOtp)) return true;
  try {
    return await bcrypt.compare(String(enteredOtp), this.otp);
  } catch (e) {
    return false;
  }
};

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
export default Otp;
