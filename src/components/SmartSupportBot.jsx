"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Package, 
  RotateCcw, 
  Tag, 
  Store, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  PhoneCall,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  ShoppingBag,
  Star,
  MapPin,
  Truck,
  Volume2,
  VolumeX,
  CreditCard,
  Coins
} from 'lucide-react';
import { lookupPincode } from '../utils/pincodeData';

export default function SmartSupportBot({ supportPhone = '+91 9172600587', supportEmail = 'support@abkharido.com' }) {
  const router = useRouter();
  const {
    currentUser,
    orders,
    products,
    addToCart,
    showToast
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState('');
  const [copiedPin, setCopiedPin] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [addedItemIds, setAddedItemIds] = useState(new Set());
  const [activeCoupons, setActiveCoupons] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const cleanPhone = String(supportPhone).replace(/[^0-9]/g, '');

  // Subtle web audio sound generator
  const playSound = (freq = 800, type = 'sine', duration = 0.1) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  };

  const defaultGreeting = useMemo(() => ({
    id: 'msg_welcome',
    sender: 'bot',
    text: currentUser 
      ? `Namaste **${currentUser.fullName || currentUser.name || 'Friend'}**! 🙏 Welcome to AbKharido AI Assistant.\n\nI can help you track your order, find discount coupons, check pincode delivery, or recommend top products.`
      : `Namaste! 🙏 Welcome to **AbKharido Smart Assistant**.\n\nHow can I help you today? Ask about orders, active coupons, delivery times, or product recommendations!`,
    timestamp: new Date(),
    chips: [
      { id: 'track_order', label: '📦 Track My Order', action: 'track_order' },
      { id: 'coupons', label: '🏷️ Active Coupons', action: 'coupons' },
      { id: 'recommend_audio', label: '🎧 Best Wireless Audio', action: 'recommend_audio' },
      { id: 'pincode_help', label: '📍 Check Pincode SLA', action: 'pincode_help' },
      { id: 'returns', label: '🔄 Returns & Refund', action: 'returns' },
      { id: 'human', label: '💬 Talk to Agent', action: 'human' }
    ]
  }), [currentUser]);

  const [messages, setMessages] = useState([defaultGreeting]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/coupons', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return;
        const now = Date.now();
        setActiveCoupons(data.filter(coupon =>
          coupon?.isActive && (!coupon.expiryDate || new Date(coupon.expiryDate).getTime() > now) && coupon.code
        ));
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    playSound(1200, 'triangle', 0.12);
    setTimeout(() => setCopiedCoupon(''), 2200);
  };

  const handleCopyPin = (pin) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    playSound(1100, 'sine', 0.1);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleAddProductFromBot = (e, prod) => {
    e.stopPropagation();
    if (!prod) return;
    addToCart(prod, 1);
    setAddedItemIds(prev => new Set(prev).add(prod.id || prod._id));
    playSound(1000, 'sine', 0.15);
    if (showToast) {
      const productName = String(prod.name || 'Product');
      showToast(`🛒 "${productName.length > 24 ? `${productName.slice(0, 24)}…` : productName}" added to cart!`, 'success');
    }
    setTimeout(() => {
      setAddedItemIds(prev => {
        const next = new Set(prev);
        next.delete(prod.id || prod._id);
        return next;
      });
    }, 2500);
  };

  // 🧠 Natural Language & Semantic Resolution Engine
  const getBotResponse = (query) => {
    const q = query.toLowerCase().trim();

    // 0. Pincode Detection (6-digit Indian PIN)
    const pinMatch = q.match(/\b([1-9][0-9]{5})\b/);
    if (pinMatch) {
      const pin = pinMatch[1];
      const pinData = lookupPincode(pin);
      if (pinData) {
        return {
          text: `📍 **Pincode Verified: ${pin} — ${pinData.city}, ${pinData.state}**\n\n` +
                `⚡ **Estimated Delivery:** by **${pinData.deliveryDateStr}** (${pinData.slaDays} business days)\n` +
                `💵 **Cash on Delivery (COD):** ${pinData.isCodAvailable ? '✅ Supported (Orders up to ₹15,000)' : 'Prepaid Only'}\n` +
                `🔄 **Doorstep Returns:** 7-Day Replacement Guarantee\n` +
                `🚚 **Free Delivery:** Available on all orders above ₹499!`,
          pincodeData: pinData,
          chips: [
            { id: 'browse_deals', label: `🛍️ Shop for ${pinData.city}`, link: '/catalog' },
            { id: 'coupons', label: '🏷️ Today\'s Offers', action: 'coupons' }
          ]
        };
      }
    }

    // 1. Order Tracking & Delivery PIN
    if (q.includes('track') || q.includes('order') || q.includes('kahan') || q.includes('status') || q.includes('delivery pin') || q.includes('kab aayega') || q.includes('dispatch') || q.includes('awb')) {
      const recentOrders = Array.isArray(orders) ? orders.slice(0, 3) : [];
      
      if (recentOrders.length > 0) {
        const topOrder = recentOrders[0];
        const orderNum = topOrder._id?.toString()?.slice(-6)?.toUpperCase() || topOrder.id || 'LIVE';
        const status = topOrder.status || 'Processing';
        const pin = /shipped|dispatch|out.?for.?delivery/i.test(status) ? topOrder.deliveryPin : null;
        const total = topOrder.totalPrice || topOrder.total || 0;
        const itemCount = topOrder.orderItems?.length || 1;
        const firstItem = topOrder.orderItems?.[0];

        return {
          text: `Here is the live status for your latest order **#${orderNum}**:`,
          orderData: {
            ...topOrder,
            orderNum,
            pin,
            status,
            total,
            itemCount,
            firstItem
          },
          chips: [
            { id: 'view_orders', label: '📄 Open My Orders Page', link: '/orders' },
            { id: 'cancel_help', label: '🔄 Return / Cancel Order', action: 'returns' },
            { id: 'human', label: '💬 Need Delivery Help? (WhatsApp)', action: 'human' }
          ]
        };
      } else {
        return {
          text: `You don't have any recent orders linked to this session. If you placed an order as a guest, please check your SMS / WhatsApp confirmation or open your Orders page.`,
          chips: [
            { id: 'open_orders', label: '📦 Go to Orders Page', link: '/orders' },
            { id: 'browse_deals', label: '🛍️ Browse Products', link: '/catalog' },
            { id: 'human', label: '💬 Talk to Support on WhatsApp', action: 'human' }
          ]
        };
      }
    }

    // 2. Active Coupons & Discounts
    if (q.includes('coupon') || q.includes('offer') || q.includes('discount') || q.includes('code') || q.includes('bachat') || q.includes('save') || q.includes('promo') || q.includes('sasta')) {
      const couponCodes = activeCoupons.map(coupon => String(coupon.code).toUpperCase()).slice(0, 3);
      return {
        text: couponCodes.length
          ? `🎉 **Active coupons:**\n\n${couponCodes.map(code => `• **${code}**`).join('\n')}\n\nFinal eligibility and savings are confirmed at checkout.`
          : `I can't confirm an active coupon right now. Check your cart or checkout page for current offers; any discount is validated before payment.`,
        couponCodes,
        chips: [
          { id: 'browse_deals', label: '🛍️ Shop with Coupon', link: '/catalog' },
          { id: 'cart_view', label: '🛒 Open My Cart', link: '/cart' }
        ]
      };
    }

    // 3. Product Catalog Recommendations & Search inside Bot
    const productKeywords = [
      'earphone', 'earphone', 'earbuds', 'speaker', 'bluetooth', 'audio', 'headphone',
      'mobile', 'phone', 'charger', 'cable', 'cover', 'smartwatch', 'watch',
      'shirt', 'tshirt', 'shoes', 'dress', 'fashion', 'gadget', 'product', 'dikhao',
      'recommend', 'best', 'chahiye', 'buy'
    ];
    const isProductSearch = productKeywords.some(kw => q.includes(kw));

    if (isProductSearch && Array.isArray(products) && products.length > 0) {
      // Extract budget if mentioned (e.g. "under 500", "under 1000")
      const budgetMatch = q.match(/under\s*₹?\s*(\d+)/i) || q.match(/(\d+)\s*(?:ke\s*andar|tak)/i);
      const budget = budgetMatch ? parseInt(budgetMatch[1], 10) : null;

      const matches = products.filter(p => {
        if (!p) return false;
        const name = (p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();

        // Check query words
        const words = q.split(/\s+/).filter(w => w.length > 2 && !['chahiye', 'dikhao', 'kya', 'best', 'under', 'wala'].includes(w));
        const matchesWord = words.length > 0
          ? words.some(w => name.includes(w) || cat.includes(w) || desc.includes(w))
          : (name.includes('speaker') || name.includes('earphone') || name.includes('wireless'));

        if (budget) {
          return matchesWord && (Number(p.price || 0) <= budget);
        }
        return matchesWord;
      }).slice(0, 3);

      const displayList = matches.length > 0 ? matches : products.slice(0, 3);

      return {
        text: matches.length > 0
          ? `✨ Found **${matches.length} top verified product${matches.length > 1 ? 's' : ''}** matching your search:`
          : `✨ Here are our bestselling verified electronics and lifestyle products:`,
        productCards: displayList,
        chips: [
          { id: 'browse_all', label: '🛍️ Browse Full Catalog', link: '/catalog' },
          { id: 'coupons', label: '🏷️ View Discount Coupons', action: 'coupons' }
        ]
      };
    }

    // 4. Returns, Cancellations & Refunds
    if (q.includes('return') || q.includes('cancel') || q.includes('refund') || q.includes('wapas') || q.includes('badalna') || q.includes('exchange') || q.includes('kharab') || q.includes('damaged') || q.includes('replace')) {
      return {
        text: `🛡️ **AbKharido 7-Day Doorstep Return & Cancellation Policy:**\n\n` +
              `• **1-Click Cancel:** Cancel anytime before courier dispatch from **My Orders**.\n` +
              `• **7-Day Doorstep Replacement:** If the product is defective, wrong size, or damaged, courier will pick it up from your doorstep.\n` +
              `• **Fast Refund:** Prepaid refunds are credited in **24–48 hours** back to your UPI/Bank or instant Wallet Coins.\n` +
              `• **Zero Return Fee:** You don't pay any courier charges for genuine returns!`,
        chips: [
          { id: 'open_orders', label: '📦 Go to My Orders to Return', link: '/orders' },
          { id: 'policy', label: '📄 Read Full Returns Policy', link: '/returns' },
          { id: 'human', label: '💬 Talk to Returns Agent on WhatsApp', action: 'human' }
        ]
      };
    }

    // 5. Payment, COD & Doorstep PIN Security
    if (q.includes('payment') || q.includes('cod') || q.includes('cash on delivery') || q.includes('upi') || q.includes('cashfree') || q.includes('safe') || q.includes('pin') || q.includes('advance')) {
      return {
        text: `🔒 **Payments & 100% Escrow Protection on AbKharido:**\n\n` +
              `• **Cash on Delivery (COD):** Available across India up to **₹15,000** with Doorstep OTP verification.\n` +
              `• **Instant Online UPI / Cards:** Google Pay, PhonePe, Paytm, RuPay via Cashfree PG with bank escrow.\n` +
              `• **Doorstep PIN Security:** Delivery agent only hands over the package once you verify your 4-digit PIN sent via SMS.\n` +
              `• **Payment Deducted but Order Failed?** The money is automatically refunded by your bank within 2–4 hours.`,
        chips: [
          { id: 'track_order', label: '📦 Check My Order Status', action: 'track_order' },
          { id: 'human', label: '💬 Payment Help on WhatsApp', action: 'human' }
        ]
      };
    }

    // 6. Delivery Charges & Free Shipping
    if (q.includes('shipping') || q.includes('delivery charge') || q.includes('free delivery') || q.includes('fees') || q.includes('kitna charge')) {
      return {
        text: `🚚 **AbKharido Shipping & Dispatch Guidelines:**\n\n` +
              `• **FREE Delivery:** On all orders above **₹499**!\n` +
              `• **Standard Shipping:** Only **₹49** for orders below ₹499.\n` +
              `• **Dispatch Timeline:** Orders are dispatched from official verified warehouses within **24 hours**.\n` +
              `• **Average Delivery:** 2 to 5 business days across Indian pincodes.`,
        chips: [
          { id: 'pincode_help', label: '📍 Check My Pincode Speed', action: 'pincode_help' },
          { id: 'browse_deals', label: '🛍️ Shop ₹499+ for Free Shipping', link: '/catalog' }
        ]
      };
    }

    // 7. Wallet Coins & Loyalty Rewards
    if (q.includes('coin') || q.includes('wallet') || q.includes('reward') || q.includes('loyalty') || q.includes('points')) {
      const userCoins = Number(currentUser?.walletCoins || 0);
      return {
        text: currentUser
          ? `🪙 **Your AB Coins balance:** **${userCoins} coins**. One coin can be used as ₹1 at checkout, subject to the eligible cart amount.`
          : `Sign in to check your AB Coins balance. At checkout, one available coin can be used as ₹1, subject to the eligible cart amount.`,
        chips: [
          { id: 'rewards_tab', label: '✨ View My Rewards Dashboard', link: '/profile?tab=rewards' },
          { id: 'browse_deals', label: '🛍️ Shop & Earn Coins', link: '/catalog' }
        ]
      };
    }

    // 8. Become a Seller / Merchant Portal
    if (q.includes('seller') || q.includes('vendor') || q.includes('bechna') || q.includes('dukaan') || q.includes('merchant') || q.includes('sell')) {
      return {
        text: `🏪 **Start Selling on AbKharido.com (Zero Fee Platform):**\n\n` +
              `• **0% Commission:** Keep 100% of your product margins.\n` +
              `• **Automated NimbusPost Courier:** Instant AWB shipping labels & doorstep pickups.\n` +
              `• **Daily Bank Settlements:** Direct IMPS/UPI payouts into your verified account.\n` +
              `• **Bulk Excel Upload:** Add 100s of products in 1 minute using standard templates.`,
        chips: [
          { id: 'open_seller', label: '🚀 Open Seller Portal', link: '/seller' },
          { id: 'human', label: '💬 Seller Onboarding Desk', action: 'human' }
        ]
      };
    }

    // 9. Contact Human Support / WhatsApp
    if (q.includes('human') || q.includes('agent') || q.includes('call') || q.includes('phone') || q.includes('number') || q.includes('baat') || q.includes('contact') || q.includes('support')) {
      return {
        text: `👤 **AbKharido Human Support Desk:**\n\n` +
              `• 📱 **WhatsApp:** +91 9172600587 (Fastest Response)\n` +
              `• ✉️ **Email:** support@abkharido.com\n` +
              `• ⏰ **Operating Hours:** Mon–Sat, 9:00 AM – 9:00 PM IST\n\n` +
              `Tap below to connect directly with a live support agent:`,
        chips: [
          { id: 'open_wa', label: '💬 Open WhatsApp Support', action: 'human' },
          { id: 'contact_page', label: '📞 Open Contact Page', link: '/contact' }
        ]
      };
    }

    // 10. Greetings
    if (['hi', 'hello', 'hey', 'namaste', 'kya hal hai', 'kaisa hai'].some(g => q.startsWith(g) || q === g)) {
      return {
        text: `Namaste! 🙏 Welcome to AbKharido.\n\nHow can I help you today? You can ask me to track your order, find discount coupons, check pincode delivery, or show bestsellers!`,
        chips: [
          { id: 'track_order', label: '📦 Track My Order', action: 'track_order' },
          { id: 'coupons', label: '🏷️ Active Coupons', action: 'coupons' },
          { id: 'recommend_audio', label: '🎧 Top Bluetooth Audio', action: 'recommend_audio' },
          { id: 'human', label: '💬 Talk to Agent', action: 'human' }
        ]
      };
    }

    // 11. Friendly Fallback
    return {
      text: `I understand! How can I best assist you with **"${query}"**? Select a quick action below or speak with our live agent on WhatsApp:`,
      chips: [
        { id: 'track_order', label: '📦 Track My Order', action: 'track_order' },
        { id: 'coupons', label: '🏷️ Today\'s Offers', action: 'coupons' },
        { id: 'recommend_audio', label: '🎧 Browse Wireless Audio', action: 'recommend_audio' },
        { id: 'returns', label: '🔄 Returns & Refund', action: 'returns' },
        { id: 'human', label: '💬 Chat on WhatsApp', action: 'human' }
      ]
    };
  };

  const handleSendMessage = (textToSend = null) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    // Add user message
    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    playSound(700, 'sine', 0.08);

    // Realistic smart AI thinking delay
    setTimeout(() => {
      const response = getBotResponse(query);
      const botMsg = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: response.text,
        orderData: response.orderData,
        couponCodes: response.couponCodes,
        productCards: response.productCards,
        pincodeData: response.pincodeData,
        chips: response.chips,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      playSound(900, 'triangle', 0.12);
    }, 400);
  };

  const handleChipClick = (chip) => {
    if (chip.link) {
      handleNavigate(chip.link);
    } else if (chip.action === 'human') {
      window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent('Hello AbKharido Support! I need human agent assistance with my order/account.')}`, '_blank');
    } else if (chip.action === 'track_order') {
      handleSendMessage('Where is my order and what is my delivery PIN?');
    } else if (chip.action === 'coupons') {
      handleSendMessage('What are today\'s best discount coupons?');
    } else if (chip.action === 'recommend_audio') {
      handleSendMessage('Show me top wireless earbuds and bluetooth speakers');
    } else if (chip.action === 'pincode_help') {
      handleSendMessage('Check delivery to pincode 401404');
    } else if (chip.action === 'returns') {
      handleSendMessage('How do I return or cancel an order?');
    } else if (chip.action === 'seller') {
      handleSendMessage('How can I become a seller on AbKharido?');
    }
  };

  // Quick suggestion chips bar above input
  const quickActions = [
    { label: '📦 Track Order', query: 'Where is my order and delivery PIN?' },
    { label: '🏷️ Save 10%', query: 'What discount coupons are active today?' },
    { label: '🎧 Audio & Tech', query: 'Show me best wireless earbuds and audio' },
    { label: '📍 Check Pincode', query: 'Check delivery for pincode 401404' },
    { label: '🔄 7-Day Returns', query: 'How does return & refund work?' },
    { label: '💬 WhatsApp Desk', action: 'human' }
  ];

  return (
    <>
      <style>{`
        /* Typing animation keyframes */
        @keyframes botTypingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        .bot-typing-dot {
          width: 5px;
          height: 5px;
          background: #2563eb;
          border-radius: 50%;
          display: inline-block;
          animation: botTypingBounce 1.2s infinite ease-in-out;
        }
        .bot-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .bot-typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @media (max-width: 768px) {
          .ai-support-floating-btn {
            bottom: calc(84px + env(safe-area-inset-bottom, 0px)) !important;
            right: 14px !important;
            width: 48px !important;
            height: 48px !important;
            padding: 0 !important;
            border-radius: 50% !important;
            justify-content: center !important;
            gap: 0 !important;
            box-shadow: 0 8px 24px rgba(37, 99, 235, 0.45) !important;
            z-index: 1500 !important;
          }
          .ai-support-btn-text {
            display: none !important;
          }
          .ai-support-chat-window {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: calc(100vh - 54px) !important;
            max-height: 100vh !important;
            border-radius: 20px 20px 0 0 !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      {/* 🟢 FLOATING AI BOT TRIGGER BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => { setIsOpen(true); playSound(950, 'sine', 0.1); }}
          className="ai-support-floating-btn"
          aria-label="Open AbKharido AI Customer Support Assistant"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 50,
            background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #2563eb 100%)',
            color: '#ffffff',
            height: '48px',
            borderRadius: '28px',
            padding: '0 16px 0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            fontFamily: "'Outfit', sans-serif"
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(37, 99, 235, 0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.35)'; }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%' }}>
              <Bot size={20} color="#ffffff" />
            </div>
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', border: '2px solid #ffffff' }}></span>
          </div>
          <div className="ai-support-btn-text" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', lineHeight: 1.1 }}>AbKharido AI</div>
            <div style={{ fontSize: '10px', color: '#bfdbfe', fontWeight: '700' }}>Instant Help</div>
          </div>
        </button>
      )}

      {/* 💬 INTERACTIVE CHAT WINDOW MODAL */}
      {isOpen && (
        <div 
          className="ai-support-chat-window animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            maxWidth: 'calc(100vw - 24px)',
            height: '590px',
            maxHeight: 'calc(100vh - 36px)',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 99999,
            overflow: 'hidden',
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #090d16 0%, #1e3a8a 60%, #2563eb 100%)',
            padding: '14px 16px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' }}>
                  <Bot size={22} color="#ffffff" />
                </div>
                <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', border: '2px solid #090d16' }}></span>
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '900', letterSpacing: '0.2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  AbKharido Assistant <Sparkles size={13} color="#facc15" />
                </div>
                <div style={{ fontSize: '11px', color: '#86efac', fontWeight: '700' }}>
                  🟢 Online • 24x7 Instant AI Support
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(prev => !prev)}
                title={soundEnabled ? "Mute audio" : "Enable audio"}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: soundEnabled ? '#facc15' : 'rgba(255,255,255,0.5)',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

              {/* Reset Chat */}
              <button
                type="button"
                onClick={() => setMessages([defaultGreeting])}
                title="Reset Chat"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: '#ffffff',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: '#ffffff',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 14px 8px 14px',
            background: 'radial-gradient(circle at top, #f8fafc 0%, #f1f5f9 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((msg) => (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: '6px'
                }}
              >
                {/* Message Bubble */}
                <div style={{
                  maxWidth: '88%',
                  padding: '12px 14px',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  boxShadow: msg.sender === 'user' ? '0 4px 14px rgba(37, 99, 235, 0.22)' : '0 2px 10px rgba(0,0,0,0.05)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  whiteSpace: 'pre-line'
                }}>
                  {msg.text}

                  {/* 📦 Live Visual Order Card if present */}
                  {msg.orderData && (
                    <div style={{
                      marginTop: '10px',
                      background: '#f8fafc',
                      borderRadius: '14px',
                      padding: '12px',
                      border: '1px solid #cbd5e1'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>ORDER ID</span>
                          <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#0f172a' }}>#{msg.orderData.orderNum}</div>
                        </div>
                        <span style={{
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                          padding: '3px 8px',
                          borderRadius: '99px',
                          fontSize: '10.5px',
                          fontWeight: '800'
                        }}>
                          ● {String(msg.orderData.status).toUpperCase()}
                        </span>
                      </div>

                      {/* Item preview */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        {msg.orderData.firstItem?.image && (
                          <img
                            src={msg.orderData.firstItem.image}
                            alt="Order item"
                            style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0' }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {msg.orderData.firstItem?.name || 'AbKharido Package'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Total: <strong>₹{msg.orderData.total}</strong> • {msg.orderData.itemCount} Item(s)
                          </div>
                        </div>
                      </div>

                      {/* 🔐 Doorstep PIN Highlight */}
                      {msg.orderData.pin && (
                        <div style={{
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
                          border: '1.5px dashed #f59e0b',
                          borderRadius: '10px',
                          padding: '8px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={16} color="#d97706" />
                            <div>
                              <div style={{ fontSize: '10px', color: '#92400e', fontWeight: '800', textTransform: 'uppercase' }}>Doorstep Delivery OTP</div>
                              <div style={{ fontSize: '14px', fontWeight: '900', color: '#b45309', letterSpacing: '1px' }}>{msg.orderData.pin}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyPin(msg.orderData.pin)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #fde68a',
                              color: '#92400e',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            {copiedPin ? <><Check size={11} color="#16a34a" /> Copied</> : <><Copy size={11} /> Copy</>}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 🏷️ Embedded Coupon Chips */}
                  {msg.couponCodes && msg.couponCodes.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {msg.couponCodes.map((code) => (
                        <div 
                          key={code}
                          onClick={() => handleCopyCoupon(code)}
                          style={{
                            background: '#eff6ff',
                            border: '1.5px dashed #2563eb',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            color: '#1e3a8a',
                            fontWeight: '800'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Tag size={13} color="#2563eb" />
                            <span>{code}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: copiedCoupon === code ? '#16a34a' : '#2563eb', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {copiedCoupon === code ? <><Check size={12} color="#16a34a" /> Copied!</> : <><Copy size={12} /> Tap to Copy</>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 🛍️ Embedded Live Product Cards in Chat */}
                  {msg.productCards && msg.productCards.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {msg.productCards.map((p, pIdx) => {
                        const isAdded = addedItemIds.has(p.id || p._id);
                        return (
                          <div
                            key={p.id || p._id || pIdx}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '8px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                            }}
                          >
                            <img
                              src={p.image || ''}
                              alt={p.name}
                              style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', background: '#f8fafc', padding: '2px', border: '1px solid #f1f5f9' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '900', color: '#059669' }}>₹{(p.price || 0).toLocaleString('en-IN')}</span>
                                {p.originalPrice > p.price && (
                                  <span style={{ fontSize: '10.5px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{p.originalPrice}</span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={(e) => handleAddProductFromBot(e, p)}
                                style={{
                                  background: isAdded ? '#16a34a' : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '10.5px',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                {isAdded ? <><Check size={11} /> Added</> : <><ShoppingBag size={11} /> Add</>}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleNavigate(`/product/${p.id || p._id}`)}
                                style={{
                                  background: '#f8fafc',
                                  color: '#334155',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                View →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Action Chips below Bot Message */}
                {msg.chips && msg.chips.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px', maxWidth: '92%' }}>
                    {msg.chips.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => handleChipClick(chip)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '16px',
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontWeight: '800',
                          color: '#1e293b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#1e293b'; }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Bouncing Animated Typing Indicator */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#ffffff', borderRadius: '16px', width: 'fit-content', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                <Bot size={15} color="#2563eb" />
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '2px 4px' }}>
                  <span className="bot-typing-dot" />
                  <span className="bot-typing-dot" />
                  <span className="bot-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Rail */}
          <div style={{
            padding: '6px 12px',
            background: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {quickActions.map((qa, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (qa.action === 'human') {
                    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent('Hello AbKharido Support! I need human agent assistance.')}`, '_blank');
                  } else {
                    handleSendMessage(qa.query);
                  }
                }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#334155',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{
              padding: '10px 14px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <input 
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything (e.g. Earbuds, Pincode 401404, Coupons...)"
              style={{
                flex: 1,
                border: '1.5px solid #e2e8f0',
                borderRadius: '20px',
                padding: '10px 16px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: "'Outfit', sans-serif"
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              style={{
                background: inputValue.trim() ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : '#e2e8f0',
                border: 'none',
                color: '#ffffff',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
