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
      udyamNumber = '',
      documents = null,
      legalBusinessName = '',
      pickupStreet = '',
      pickupCity = '',
      pickupState = '',
      pickupPincode = '',
      pickupPhone = ''
    } = body;

    const rawIdentifier = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '');

    if (!rawIdentifier || !rawPassword) {
      return NextResponse.json({ error: 'Email/phone and password are required' }, { status: 400 });
    }

    await connectDB();

    // ─── SIGNUP / ONBOARDING / UPGRADING EXISTING CUSTOMER ─────────────
    if (action === 'signup') {
      if (!isValidEmail(rawIdentifier)) {
        return NextResponse.json({ error: 'Please enter a valid email address (e.g. store@brand.com).' }, { status: 400 });
      }
      
      const cleanShopName = String(shopName || '').trim();
      if (!cleanShopName) {
        return NextResponse.json({ error: 'Please enter your Store / Brand Name.' }, { status: 400 });
      }

      if (rawPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }

      const cleanPhone = typeof phone === 'string' && phone.trim() 
        ? phone.trim().replace(/\D/g, '').slice(-10) 
        : '';

      if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        return NextResponse.json({ error: 'Please enter a valid 10-digit Indian mobile number starting with 6-9.' }, { status: 400 });
      }

      const isGst = sellerType === 'gst';
      const cleanGst = String(gstin || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      let cleanPan = String(pan || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

      if (isGst) {
        if (!cleanGst || !GSTIN_REGEX.test(cleanGst)) {
          return NextResponse.json({ 
            error: 'Please enter a valid 15-character Indian GSTIN (e.g. 27AAPCA1234F1Z5).' 
          }, { status: 400 });
        }
        // Automatically extract 10-digit PAN from GSTIN (characters 3 to 12)
        cleanPan = cleanGst.slice(2, 12);
      } else {
        // Non-GST Small Seller Scheme (Notification 34/2023 & Section 194-O TDS)
        if (!cleanPan || !PAN_REGEX.test(cleanPan)) {
          return NextResponse.json({ 
            error: 'Please enter a valid 10-character PAN Card number (e.g. ABCDE1234F). It must consist of 5 uppercase letters, 4 numbers, and 1 uppercase letter.' 
          }, { status: 400 });
        }
      }

      const formattedPickup = {
        street: String(pickupStreet || address || 'Seller Registered Warehouse').trim(),
        city: String(pickupCity || 'Mumbai').trim(),
        state: String(pickupState || 'Maharashtra').trim(),
        pincode: String(pickupPincode || '400001').replace(/\D/g, '').slice(0, 6),
        phone: String(pickupPhone || cleanPhone).trim()
      };

      const cleanLegalName = String(legalBusinessName || cleanShopName).trim();

      // Check if an existing account (buyer/customer or seller) already exists
      const userClauses = [
        { email: rawIdentifier },
        { username: rawIdentifier }
      ];
      if (cleanPhone) {
        userClauses.push(
          { phone: cleanPhone },
          { phone: '+91' + cleanPhone },
          { phone: '91' + cleanPhone },
          { username: cleanPhone }
        );
      }

      const existingUser = await User.findOne({ $or: userClauses }).select('+password');

      if (existingUser) {
        // Verify credentials against existing account
        const isMatch = await existingUser.matchPassword(rawPassword);
        if (!isMatch) {
          return NextResponse.json({ 
            error: 'An AbKharido customer account with this email/phone already exists. Please enter your existing account password to securely link and activate your Seller Store.' 
          }, { status: 400 });
        }

        // Account exists and password matches! Seamlessly upgrade to Seller without DB duplication
        existingUser.shopName = cleanShopName;
        existingUser.sellerType = isGst ? 'gst' : 'non_gst';
        existingUser.gstin = isGst ? cleanGst : undefined;
        existingUser.pan = cleanPan;
        existingUser.enrolmentId = enrolmentId ? String(enrolmentId).trim() : undefined;
        existingUser.udyamNumber = udyamNumber ? String(udyamNumber).trim().toUpperCase() : (existingUser.udyamNumber || undefined);
        if (documents && typeof documents === 'object') {
          existingUser.documents = { ...(existingUser.documents || {}), ...documents };
        }
        existingUser.legalBusinessName = cleanLegalName;
        existingUser.turnoverCertified = true;
        existingUser.sellerStatus = 'Approved';
        
        // Retain super_admin or admin roles; upgrade 'user' to 'seller'
        if (existingUser.role !== 'admin' && existingUser.role !== 'super_admin') {
          existingUser.role = 'seller';
        }

        if (!existingUser.phone && cleanPhone) {
          existingUser.phone = cleanPhone;
        }

        existingUser.pickupAddress = formattedPickup;
        existingUser.address = existingUser.address || `${formattedPickup.street}, ${formattedPickup.city}, ${formattedPickup.state} ${formattedPickup.pincode}`;

        existingUser.payoutDetails = {
          upiId: typeof upi === 'string' && upi.trim() ? upi.trim() : (existingUser.payoutDetails?.upiId || ''),
          bankAccount: typeof bankAccount === 'string' && bankAccount.trim() ? bankAccount.trim() : (existingUser.payoutDetails?.bankAccount || ''),
          ifsc: typeof bankIfsc === 'string' && bankIfsc.trim() ? bankIfsc.trim().toUpperCase() : (existingUser.payoutDetails?.ifsc || ''),
          accountHolderName: accountHolderName ? accountHolderName.trim() : (cleanLegalName || existingUser.payoutDetails?.accountHolderName || cleanShopName),
          bankName: bankName ? bankName.trim() : (existingUser.payoutDetails?.bankName || 'HDFC Bank'),
          verified: true
        };

        await existingUser.save();
        const token = signUserToken(existingUser._id);

        return NextResponse.json({
          success: true,
          message: `🎉 Success! Your AbKharido account has been upgraded to a Verified Seller Store (${cleanShopName}). Both customer and seller features are linked to your profile.`,
          seller: {
            id: existingUser._id,
            email: existingUser.email,
            phone: existingUser.phone,
            shopName: existingUser.shopName,
            sellerStatus: existingUser.sellerStatus,
            sellerType: existingUser.sellerType,
            gstin: existingUser.gstin || '',
            pan: existingUser.pan || '',
            enrolmentId: existingUser.enrolmentId || '',
            legalBusinessName: existingUser.legalBusinessName || existingUser.shopName,
            walletCash: existingUser.walletCash || 0,
            payoutDetails: existingUser.payoutDetails,
            pickupAddress: existingUser.pickupAddress,
            token
          }
        }, { status: 200 });
      }

      // Brand new user registration as seller
      const seller = await User.create({
        username: rawIdentifier,
        email: rawIdentifier,
        password: rawPassword,
        role: 'seller',
        sellerStatus: 'Approved', // Auto-approved for frictionless onboarding
        sellerType: isGst ? 'gst' : 'non_gst',
        gstin: isGst ? cleanGst : undefined,
        pan: cleanPan,
        enrolmentId: enrolmentId ? String(enrolmentId).trim() : undefined,
        udyamNumber: udyamNumber ? String(udyamNumber).trim().toUpperCase() : undefined,
        documents: documents && typeof documents === 'object' ? documents : undefined,
        legalBusinessName: cleanLegalName,
        turnoverCertified: true,
        shopName: cleanShopName,
        phone: cleanPhone,
        address: typeof address === 'string' && address.trim() ? address.trim() : `${formattedPickup.street}, ${formattedPickup.city}, ${formattedPickup.state} ${formattedPickup.pincode}`,
        pickupAddress: formattedPickup,
        payoutDetails: {
          upiId: typeof upi === 'string' ? upi.trim() : '',
          bankAccount: typeof bankAccount === 'string' ? bankAccount.trim() : '',
          ifsc: typeof bankIfsc === 'string' ? bankIfsc.trim().toUpperCase() : '',
          accountHolderName: accountHolderName ? accountHolderName.trim() : cleanLegalName,
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
          phone: seller.phone,
          shopName: seller.shopName,
          sellerStatus: seller.sellerStatus,
          sellerType: seller.sellerType,
          gstin: seller.gstin || '',
          pan: seller.pan || '',
          enrolmentId: seller.enrolmentId || '',
          udyamNumber: seller.udyamNumber || '',
          legalBusinessName: seller.legalBusinessName || seller.shopName,
          walletCash: seller.walletCash || 0,
          payoutDetails: seller.payoutDetails,
          pickupAddress: seller.pickupAddress,
          role: seller.role,
          token
        }
      }, { status: 201 });
    }

    // ─── LOGIN ────────────────────────────────────────────────────────
    if (action !== 'login') {
      return NextResponse.json({ error: 'Invalid authentication action' }, { status: 400 });
    }

    const digits = rawIdentifier.replace(/\D/g, '').slice(-10);
    const loginClauses = [
      { email: rawIdentifier },
      { username: rawIdentifier }
    ];
    if (digits.length === 10) {
      loginClauses.push(
        { phone: digits },
        { phone: '+91' + digits },
        { phone: '91' + digits },
        { username: digits }
      );
    }

    const seller = await User.findOne({ $or: loginClauses }).select('+password');

    if (!seller || !await seller.matchPassword(rawPassword)) {
      return NextResponse.json({ error: 'Invalid merchant email/phone or password' }, { status: 401 });
    }

    if (seller.status === 'Suspended') {
      return NextResponse.json({ error: 'This account is suspended. Please contact AbKharido support.' }, { status: 403 });
    }

    if (seller.sellerStatus === 'Rejected') {
      return NextResponse.json({ error: 'Seller account was declined by compliance.' }, { status: 403 });
    }

    const isOwner = digits === '9172600587' || rawIdentifier === 'rj901126@gmail.com' || rawIdentifier === 'admin@abkharido.com';
    const isAdmin = isOwner || ['admin', 'super_admin'].includes(seller.role);
    const hasStore = Boolean(seller.shopName || seller.sellerStatus === 'Approved' || seller.role === 'seller');

    // If valid customer account but store hasn't been set up yet
    if (!isAdmin && !hasStore) {
      return NextResponse.json({ 
        error: 'You have an active AbKharido customer account, but your Seller Store is not set up yet. Click "Open New Seller Account" to register your store name and PAN in 1 minute.',
        isCustomerAccount: true,
        email: seller.email || '',
        phone: seller.phone || digits || '',
        name: seller.fullName || seller.username || ''
      }, { status: 403 });
    }

    // Auto-activate seller status if admin or has store
    if (seller.sellerStatus !== 'Approved') {
      seller.sellerStatus = 'Approved';
      if (!isAdmin && seller.role !== 'seller') {
        seller.role = 'seller';
      }
      await seller.save();
    }

    const token = signUserToken(seller._id);

    return NextResponse.json({
      success: true,
      seller: {
        id: seller._id,
        email: seller.email,
        phone: seller.phone,
        shopName: seller.shopName || (isAdmin ? 'AbKharido Master Store' : 'Verified Merchant Store'),
        sellerStatus: seller.sellerStatus,
        sellerType: seller.sellerType || (seller.gstin ? 'gst' : 'non_gst'),
        gstin: seller.gstin || '',
        pan: seller.pan || '',
        enrolmentId: seller.enrolmentId || '',
        udyamNumber: seller.udyamNumber || '',
        legalBusinessName: seller.legalBusinessName || seller.shopName,
        walletCash: seller.walletCash || 0,
        payoutDetails: seller.payoutDetails,
        pickupAddress: seller.pickupAddress,
        role: seller.role,
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
