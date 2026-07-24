import { NextResponse } from 'next/server';

// Mock: Send OTP (for demo without real SMS backend)
export async function POST(request) {
  const { recipient } = await request.json();
  // In demo mode, generate a fixed OTP visible in console
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP temporarily in a simple in-memory map (per process)
  global._mockOtpStore = global._mockOtpStore || {};
  global._mockOtpStore[recipient] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  console.log(`[MOCK OTP] Phone: ${recipient} | OTP: ${otp}`);
  
  return NextResponse.json({ 
    success: true, 
    message: 'OTP sent (demo mode)',
    // In demo mode, return OTP so frontend can display it
    demoOtp: otp
  });
}
