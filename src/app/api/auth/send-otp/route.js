import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Otp from '../../../../../server/models/Otp.js';

export async function POST(request) {
  try {
    const { recipient } = await request.json();
    await connectDB();

    // Delete existing OTPs for this phone to avoid clutter
    await Otp.deleteMany({ phone: recipient });

    // Generate a new 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to DB
    const otpEntry = new Otp({ phone: recipient, otp: otpCode });
    await otpEntry.save();

    console.log(`[ENTERPRISE OTP] Phone: ${recipient} | OTP: ${otpCode}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // We return demoOtp for testing purposes in the absence of a real SMS gateway provider.
      demoOtp: otpCode
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
