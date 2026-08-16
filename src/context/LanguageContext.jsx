"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Top Nav / Navigation
    searchPlaceholder: 'Search for products, brands and more...',
    listeningText: '🎙️ Listening... Speak your product name now...',
    login: 'Login',
    cart: 'Cart',
    myProfile: 'My Profile',
    myWishlist: 'My Wishlist',
    myOrders: 'My Orders',
    sellOnAbKharido: 'Sell on AbKharido',
    logout: 'Logout Account',
    
    // Product Page
    buyNow: '⚡ BUY NOW',
    addToCart: '🛍️ ADD TO CART',
    soldOut: 'SOLD OUT',
    freeDelivery: 'FREE Delivery',
    codAvailable: '💵 Cash on Delivery Available',
    genuineStock: '100% Genuine Stock',
    expressShipping: 'Priority Express Shipping',
    easyReturns: '7-Day Easy Returns',
    checkPincode: 'Check Delivery Speed & COD Availability',
    reviews: 'Customer Reviews',
    writeReview: 'Write a Customer Review',
    verifiedBuyer: 'Verified Buyer',
    emiStarting: 'No-Cost EMI starting at',
    
    // Checkout & Cart
    shippingAddress: 'Delivery Address',
    orderSummary: 'Order Summary',
    paymentMethod: 'Payment Option',
    totalPayable: 'Total Payable Amount',
    placeCodOrder: '🛍️ Place Cash on Delivery Order',
    payViaCashfree: '🔒 Pay via Cashfree Escrow',
    applyCoupon: 'Apply Voucher',
    
    // Trust & Guarantee
    escrowProtected: '100% Cashfree Protected',
    bankEscrow: 'Bank-grade escrow refund security',
  },
  hi: {
    // Top Nav / Navigation
    searchPlaceholder: 'उत्पाद, ब्रांड या श्रेणी खोजें...',
    listeningText: '🎙️ सुन रहे हैं... अपने उत्पाद का नाम बोलें...',
    login: 'लॉग इन करें',
    cart: 'कार्ट',
    myProfile: 'मेरी प्रोफाइल',
    myWishlist: 'मेरी विशलिस्ट',
    myOrders: 'मेरे ऑर्डर्स',
    sellOnAbKharido: 'अबखरीदो पर बेचें',
    logout: 'खाता लॉगआउट करें',
    
    // Product Page
    buyNow: '⚡ अभी खरीदें',
    addToCart: '🛍️ कार्ट में जोड़ें',
    soldOut: 'स्टॉक समाप्त',
    freeDelivery: 'मुफ़्त डिलीवरी',
    codAvailable: '💵 कैश ऑन डिलीवरी उपलब्ध',
    genuineStock: '100% प्रामाणिक उत्पाद',
    expressShipping: 'प्राथमिकता एक्सप्रेस डिलीवरी',
    easyReturns: '7 दिन में आसान वापसी',
    checkPincode: 'डिलीवरी और कैश ऑन डिलीवरी की जांच करें',
    reviews: 'ग्राहक समीक्षाएं',
    writeReview: 'समीक्षा लिखें',
    verifiedBuyer: 'सत्यापित खरीदार',
    emiStarting: 'बिना ब्याज ईएमआई शुरू',
    
    // Checkout & Cart
    shippingAddress: 'डिलीवरी का पता',
    orderSummary: 'ऑर्डर सारांश',
    paymentMethod: 'भुगतान विकल्प',
    totalPayable: 'कुल देय राशि',
    placeCodOrder: '🛍️ कैश ऑन डिलीवरी ऑर्डर दें',
    payViaCashfree: '🔒 कैशफ्री सुरक्षित भुगतान करें',
    applyCoupon: 'कूपन लागू करें',
    
    // Trust & Guarantee
    escrowProtected: '100% सुरक्षित और संरक्षित',
    bankEscrow: 'बैंक एस्क्रो रिफंड गारंटी',
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('abkharido_language');
      if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
        setLang(savedLang);
      }
    } catch (_e) {}
  }, []);

  const changeLanguage = (newLang) => {
    if (newLang === 'en' || newLang === 'hi') {
      setLang(newLang);
      try {
        localStorage.setItem('abkharido_language', newLang);
      } catch (_e) {}
    }
  };

  const t = (key, fallback = '') => {
    return translations[lang]?.[key] || translations['en']?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: 'en',
      changeLanguage: () => {},
      t: (key, fallback = '') => fallback || key
    };
  }
  return context;
};
