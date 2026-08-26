import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'abkharido_enterprise_secret_2026_super_secure';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { action = 'login', email, password, phone, shopName, address, upi, bankAccount, bankIfsc } = body;

    // ─── ACTION: SIGNUP ─────────────────────────────────────────────
    if (action === 'signup') {
      if (!email || !password || !shopName) {
        return NextResponse.json({ error: 'Email, password, and shop name are required' }, { status: 400 });
      }

      // Check existing user
      const existing = await User.findOne({ 
        $or: [{ email: email.toLowerCase().trim() }, { username: email.toLowerCase().trim() }] 
      });

      if (existing) {
        if (existing.role === 'seller') {
          return NextResponse.json({ error: 'A seller account with this email already exists. Please login.' }, { status: 400 });
        }
        // Upgrade existing user to seller
        existing.role = 'seller';
        existing.sellerStatus = 'Pending';
        existing.shopName = shopName.trim();
        existing.phone = phone || existing.phone;
        existing.address = address || existing.address;
        existing.payoutDetails = {
          upiId: upi || '',
          bankAccount: bankAccount || '',
          ifsc: bankIfsc || ''
        };
        await existing.save();

        const token = jwt.sign(
          { id: existing._id, email: existing.email, role: 'seller', shopName: existing.shopName },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        return NextResponse.json({
          success: true,
          message: 'Seller application submitted for verification',
          seller: {
            id: existing._id,
            email: existing.email,
            shopName: existing.shopName,
            sellerStatus: existing.sellerStatus,
            token
          }
        });
      }

      // Create new Seller User
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const newSeller = new User({
        username: email.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'seller',
        sellerStatus: 'Approved', // Auto-approved in sandbox / fast onboarding
        shopName: shopName.trim(),
        phone: phone || '',
        address: address || '',
        payoutDetails: {
          upiId: upi || '',
          bankAccount: bankAccount || '',
          ifsc: bankIfsc || ''
        },
        walletCoins: 500
      });

      await newSeller.save();

      const token = jwt.sign(
        { id: newSeller._id, email: newSeller.email, role: 'seller', shopName: newSeller.shopName },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return NextResponse.json({
        success: true,
        message: 'Seller account registered successfully',
        seller: {
          id: newSeller._id,
          email: newSeller.email,
          shopName: newSeller.shopName,
          sellerStatus: newSeller.sellerStatus,
          walletCoins: newSeller.walletCoins,
          token
        }
      });
    }

    // ─── ACTION: LOGIN ──────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Direct sandbox demo login support
    if (email === 'demo@seller.com' && password === 'seller123') {
      const demoToken = jwt.sign(
        { id: 'demo_seller_101', email: 'demo@seller.com', role: 'seller', shopName: 'AbKharido Premier Electronics' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      return NextResponse.json({
        success: true,
        message: 'Logged in as Demo Merchant',
        seller: {
          id: 'demo_seller_101',
          email: 'demo@seller.com',
          shopName: 'AbKharido Premier Electronics',
          sellerStatus: 'Approved',
          walletCoins: 12500,
          token: demoToken
        }
      });
    }

    const seller = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: email.toLowerCase().trim() },
        { phone: email.trim() }
      ]
    });

    if (!seller) {
      return NextResponse.json({ error: 'No merchant account found with these credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: seller._id, email: seller.email, role: seller.role || 'seller', shopName: seller.shopName || seller.fullName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Seller logged in successfully',
      seller: {
        id: seller._id,
        email: seller.email,
        shopName: seller.shopName || seller.fullName || 'Official Seller',
        sellerStatus: seller.sellerStatus || 'Approved',
        walletCoins: seller.walletCoins || 0,
        token
      }
    });

  } catch (error) {
    console.error('Seller Auth Error:', error);
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}
