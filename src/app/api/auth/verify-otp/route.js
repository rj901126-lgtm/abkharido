import { NextResponse } from 'next/server';

// Mock: Verify OTP
export async function POST(request) {
  const { recipient, otp } = await request.json();

  const store = global._mockOtpStore || {};
  const record = store[recipient];

  // Allow any 6-digit OTP in demo mode, or validate stored one
  const isValid = record 
    ? (record.otp === otp && Date.now() < record.expires)
    : otp.length === 6; // demo fallback: any 6-digit code works

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
  }

  // Clear used OTP
  if (store[recipient]) delete store[recipient];

  // Return a mock user session
  const mockUser = {
    _id: 'mock-' + Date.now(),
    username: 'user_' + recipient.slice(-4),
    fullName: 'Demo User',
    phone: recipient,
    email: '',
    isInfluencer: false,
    walletCoins: 0,
    walletCash: 0,
    role: 'user'
  };

  return NextResponse.json({ user: mockUser, token: 'mock-token-' + Date.now() });
}
