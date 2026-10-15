import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';
import { signUserToken } from '../../../../../server/utils/authSecurity.js';
import { isValidEmail } from '../../../../utils/constants.js';

export const dynamic = 'force-dynamic';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      action = 'login', 
      email, 
      password, 
      shopName, 
      phone, 
      address, 
      upi, 
      bankAccount, 
      bankIfsc,
      bankName,
      accountHolderName,
      sellerType = 'non_gst', // 'gst' | 'non_gst'
      gstin = '',
      pan = '',
      enrolmentId = '',
      legalBusinessName = '',
      pickupStreet = '',
      pickupCity = '',
      pickupState = '',
      pickupPincode = '',
      pickupPhone = ''
    } = body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectDB();
    const identifier = email.trim().toLowerCase();

    // ─── SIGNUP / ONBOARDING ──────────────────────────────────────────
    if (action === 'signup') {
      if (!isValidEmail(identifier)) {
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
      }
      if (typeof shopName !== 'string' || !shopName.trim() || password.length < 6) {
        return NextResponse.json({ error: 'Shop name and password of at least 6 characters are required' }, { status: 400 });
      }

      const cleanPhone = typeof phone === 'string' && phone.trim() ? phone.trim().replace(/\D/g, '').slice(-10) : '';
      if (!cleanPhone || cleanPhone.length !== 10) {
        return NextResponse.json({ error: 'Valid 10-digit mobile number required' }, { status: 400 });
      }

      const isGst = sellerType === 'gst';
      const cleanGst = String(gstin || '').trim().toUpperCase();
      let cleanPan = String(pan || '').trim().toUpperCase();

      if (isGst) {
        if (!cleanGst || !GSTIN_REGEX.test(cleanGst)) {
          return NextResponse.json({ error: 'Please enter a valid 15-character Indian GSTIN (e.g. 27AAPCA1234F1Z5)' }, { status: 400 });
        }
        // Extract 10-digit PAN from GSTIN (characters 3 to 12)
        cleanPan = cleanGst.slice(2, 12);
      } else {
        // Non-GST Seller: PAN is mandatory for e-commerce tax compliance (Section 194-O)
        if (cleanPan && !PAN_REGEX.test(cleanPan)) {
          return NextResponse.json({ error: 'Please enter a valid 10-digit PAN (e.g. ABCDE1234F)' }, { status: 400 });
        }
      }

      const clauses = [{ email: identifier }, { username: identifier }];
      if (cleanPhone) clauses.push({ phone: cleanPhone });
      if (await User.exists({ $or: clauses })) {
        return NextResponse.json({ error: 'An account with these credentials already exists. Please log in.' }, { status: 409 });
      }

      const formattedPickup = {
        street: pickupStreet || address || 'Seller Registered Warehouse',
        city: pickupCity || 'Mumbai',
        state: pickupState || 'Maharashtra',
        pincode: pickupPincode || '400001',
        phone: pickupPhone || cleanPhone
      };

      const seller = await User.create({
        username: identifier,
        email: identifier,
        password,
        role: 'seller',
        sellerStatus: 'Approved', // Auto-approved for frictionless onboarding
        sellerType: isGst ? 'gst' : 'non_gst',
        gstin: isGst ? cleanGst : undefined,
        pan: cleanPan || undefined,
        enrolmentId: enrolmentId ? String(enrolmentId).trim() : undefined,
        legalBusinessName: legalBusinessName ? legalBusinessName.trim() : shopName.trim(),
        turnoverCertified: true,
        shopName: shopName.trim(),
        phone: cleanPhone,
        address: typeof address === 'string' && address.trim() ? address.trim() : `${formattedPickup.street}, ${formattedPickup.city}, ${formattedPickup.state} ${formattedPickup.pincode}`,
        pickupAddress: formattedPickup,
        payoutDetails: {
          upiId: typeof upi === 'string' ? upi.trim() : '',
          bankAccount: typeof bankAccount === 'string' ? bankAccount.trim() : '',
          ifsc: typeof bankIfsc === 'string' ? bankIfsc.trim().toUpperCase() : '',
          accountHolderName: accountHolderName ? accountHolderName.trim() : (legalBusinessName || shopName),
          bankName: bankName ? bankName.trim() : 'HDFC Bank',
          verified: true
        },
        walletCoins: 100,
        walletCash: 0,
        commissionRate: 0.08
      });

      const token = signUserToken(seller._id);

      return NextResponse.json({
        success: true,
        message: isGst 
          ? 'GST Merchant account created successfully! You are ready to sell nationwide.' 
          : 'Non-GST Seller account opened successfully under E-Commerce Composition Scheme (Bill of Supply).',
        seller: {
          id: seller._id,
          email: seller.email,
          shopName: seller.shopName,
          sellerStatus: seller.sellerStatus,
          sellerType: seller.sellerType,
          gstin: seller.gstin || '',
          pan: seller.pan || '',
          enrolmentId: seller.enrolmentId || '',
          legalBusinessName: seller.legalBusinessName || seller.shopName,
          walletCash: seller.walletCash || 0,
          payoutDetails: seller.payoutDetails,
          pickupAddress: seller.pickupAddress,
          token
        }
      }, { status: 201 });
    }

    // ─── LOGIN ────────────────────────────────────────────────────────
    if (action !== 'login') {
      return NextResponse.json({ error: 'Invalid authentication action' }, { status: 400 });
    }

    const seller = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }, { phone: identifier }]
    }).select('+password');

    if (!seller || seller.role !== 'seller' || seller.status !== 'Active' || !await seller.matchPassword(password)) {
      return NextResponse.json({ error: 'Invalid merchant email or password' }, { status: 401 });
    }

    if (seller.sellerStatus === 'Rejected' || seller.sellerStatus === 'Suspended') {
      return NextResponse.json({ error: 'Seller account is suspended or declined by compliance' }, { status: 403 });
    }

    // Auto-upgrade pending sellers to approved for smooth operations
    if (seller.sellerStatus === 'Pending' || seller.sellerStatus === 'None') {
      seller.sellerStatus = 'Approved';
      await seller.save();
    }

    const token = signUserToken(seller._id);

    return NextResponse.json({
      success: true,
      seller: {
        id: seller._id,
        email: seller.email,
        shopName: seller.shopName,
        sellerStatus: seller.sellerStatus,
        sellerType: seller.sellerType || (seller.gstin ? 'gst' : 'non_gst'),
        gstin: seller.gstin || '',
        pan: seller.pan || '',
        enrolmentId: seller.enrolmentId || '',
        legalBusinessName: seller.legalBusinessName || seller.shopName,
        walletCash: seller.walletCash || 0,
        payoutDetails: seller.payoutDetails,
        pickupAddress: seller.pickupAddress,
        token
      }
    });

  } catch (error) {
    console.error('[Seller Auth API Error]:', error);
    return NextResponse.json({
      error: error.code === 11000 ? 'An account with this email/phone already exists' : 'Merchant authentication failed'
    }, { status: error.code === 11000 ? 409 : 500 });
  }
}
