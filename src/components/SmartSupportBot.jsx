"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  Check
} from 'lucide-react';

export default function SmartSupportBot({ supportPhone = '+91 9172600587', supportEmail = 'support@abkharido.com' }) {
  const router = useRouter();
  const { currentUser, orders, appliedCoupon } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState('');
  const [customRules, setCustomRules] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const cleanPhone = String(supportPhone).replace(/[^0-9]/g, '');

  // Load custom admin-trained rules
  useEffect(() => {
    fetch('/api/admin/bot-config')
      .then(res => res.json())
      .then(data => {
        if (data?.config?.customRules) {
          setCustomRules(data.config.customRules);
        }
      })
      .catch(() => {});
  }, []);

  const defaultGreeting = {
    id: 'msg_welcome',
    sender: 'bot',
    text: currentUser 
      ? `Namaste **${currentUser.fullName || currentUser.name || 'Friend'}**! 🙏 Welcome to AbKharido AI Assistant. How can I help you today?`
      : `Namaste! 🙏 Welcome to **AbKharido 24/7 Smart Support**. How can I help you today?`,
    timestamp: new Date(),
    chips: [
      { id: 'track_order', label: '📦 Track My Order', action: 'track_order' },
      { id: 'coupons', label: '🏷️ Active Coupons', action: 'coupons' },
      { id: 'returns', label: '🔄 Returns & Refund', action: 'returns' },
      { id: 'seller', label: '🏪 Become a Seller', action: 'seller' },
      { id: 'human', label: '💬 Talk to Agent', action: 'human' }
    ]
  };

  const [messages, setMessages] = useState([defaultGreeting]);

  // Scroll to bottom of message list
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(''), 2000);
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    router.push(path);
  };

  const getBotResponse = (query) => {
    const q = query.toLowerCase().trim();

    // 0. Check Operator/Admin Trained Custom Knowledge Rules First
    if (Array.isArray(customRules) && customRules.length > 0) {
      for (const rule of customRules) {
        if (rule.isActive && Array.isArray(rule.triggerKeywords)) {
          const isMatch = rule.triggerKeywords.some(kw => q.includes(kw.toLowerCase().trim()));
          if (isMatch) {
            return {
              text: rule.response,
              chips: [
                { id: 'track_order', label: '📦 Track My Order', action: 'track_order' },
                { id: 'coupons', label: '🏷️ Today\'s Offers', action: 'coupons' },
                { id: 'human', label: '💬 Talk to Agent', action: 'human' }
              ]
            };
          }
        }
      }
    }

    // 1. Order Tracking & Delivery PIN
    if (q.includes('track') || q.includes('order') || q.includes('kahan') || q.includes('status') || q.includes('delivery') || q.includes('pin') || q.includes('dispatch')) {
      const recentOrders = Array.isArray(orders) ? orders.slice(0, 3) : [];
      
      if (recentOrders.length > 0) {
        const topOrder = recentOrders[0];
        const orderNum = topOrder._id?.toString()?.slice(-6)?.toUpperCase() || topOrder.id || 'LIVE';
        const itemCount = topOrder.orderItems?.length || 1;
        const total = (topOrder.totalPrice || topOrder.amount || 0).toLocaleString('en-IN');
        const pin = topOrder.deliveryPin || '5821';
        const status = topOrder.status || 'Processing';
        const itemName = topOrder.orderItems?.[0]?.name || 'AbKharido Product';

        return {
          text: `Here is the live status for your recent order **#${orderNum}**:\n\n` +
                `📦 **Item:** ${itemName} ${itemCount > 1 ? `(+${itemCount - 1} more)` : ''}\n` +
                `📊 **Status:** ${status.toUpperCase()} (Express Courier Dispatch)\n` +
                `💰 **Total:** ₹${total}\n` +
                `🔐 **Doorstep OTP/PIN:** \`${pin}\` (Share this with delivery agent upon arrival)\n\n` +
                `You can view full tracking history and download the tax invoice below:`,
          orderData: topOrder,
          chips: [
            { id: 'view_orders', label: '📄 Open My Orders Page', link: '/orders' },
            { id: 'cancel_help', label: '❌ Cancel / Return Order', action: 'returns' },
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
    if (q.includes('coupon') || q.includes('offer') || q.includes('discount') || q.includes('code') || q.includes('bachat') || q.includes('save') || q.includes('promo')) {
      return {
        text: `🎉 **Today's Verified Discount Coupons on AbKharido:**\n\n` +
              `1️⃣ **\`SAVE10\`** — Instant **10% OFF** on all orders above ₹499.\n` +
              `2️⃣ **\`FIRSTBUY\`** — Flat **₹150 OFF** for your first order.\n` +
              `3️⃣ **\`ABVIP500\`** — Flat **₹500 OFF** on premium luxury items.\n\n` +
              `⚡ *Tap any coupon code below to copy instantly:*`,
        couponCodes: ['SAVE10', 'FIRSTBUY', 'ABVIP500'],
        chips: [
          { id: 'browse_deals', label: '🛍️ Shop with Coupon', link: '/catalog' },
          { id: 'cart_view', label: '🛒 Open My Cart', link: '/cart' }
        ]
      };
    }

    // 3. Returns, Cancellations & Refunds
    if (q.includes('return') || q.includes('cancel') || q.includes('refund') || q.includes('wapas') || q.includes('badalna') || q.includes('exchange') || q.includes('money')) {
      return {
        text: `🛡️ **AbKharido Hassle-Free 7-Day Return & Cancellation Policy:**\n\n` +
              `• **Instant Cancellation:** You can cancel orders anytime before dispatch from your **My Orders** page with 1 tap.\n` +
              `• **7-Day Doorstep Replacement/Refund:** If you received a defective, wrong size, or damaged product, courier will pick it up from your doorstep.\n` +
              `• **Instant Refund:** Prepaid refunds are processed in **24-48 hours** directly to your original payment method or instant AbKharido Wallet Coins.`,
        chips: [
          { id: 'open_orders', label: '📦 Go to My Orders to Cancel/Return', link: '/orders' },
          { id: 'policy', label: '📄 Read Full Returns Policy', link: '/returns' },
          { id: 'human', label: '💬 Connect with Return Agent', action: 'human' }
        ]
      };
    }

    // 4. Become a Seller / Merchant Portal
    if (q.includes('seller') || q.includes('vendor') || q.includes('bechna') || q.includes('dukaan') || q.includes('merchant') || q.includes('sell')) {
      return {
        text: `🏪 **Start Selling on AbKharido.com (0% Commission Platform):**\n\n` +
              `• **0% Fixed Fees:** Keep 100% of your product profits.\n` +
              `• **Bulk Excel Import:** Upload hundreds of products in seconds with CSV template.\n` +
              `• **Automated NimbusPost Shipping:** Instant AWB shipping labels & doorstep courier pickups.\n` +
              `• **Daily Bank Settlements:** Direct IMPS/UPI payouts to your bank account.`,
        chips: [
          { id: 'open_seller', label: '🚀 Open Seller Portal', link: '/seller' },
          { id: 'human', label: '💬 Seller Onboarding WhatsApp Desk', action: 'human' }
        ]
      };
    }

    // 5. Payment, COD & Security Queries
    if (q.includes('payment') || q.includes('cod') || q.includes('cash on delivery') || q.includes('upi') || q.includes('cashfree') || q.includes('safe') || q.includes('failed')) {
      return {
        text: `🔒 **Payment & Checkout Protection on AbKharido:**\n\n` +
              `• **Instant UPI & Cards:** 100% Bank-Grade Escrow via Cashfree PG (Google Pay, PhonePe, Paytm, RuPay).\n` +
              `• **Cash on Delivery (COD):** Available for orders up to **₹15,000** with Doorstep PIN Verification.\n` +
              `• **Payment Deducted but Order Failed?** Amount is automatically refunded to your bank account within 2-4 business hours.`,
        chips: [
          { id: 'track_order', label: '📦 Check My Order Status', action: 'track_order' },
          { id: 'human', label: '💬 Report Payment Issue on WhatsApp', action: 'human' }
        ]
      };
    }

    // 6. Contact Human Support / WhatsApp
    if (q.includes('human') || q.includes('agent') || q.includes('call') || q.includes('phone') || q.includes('number') || q.includes('baat') || q.includes('help') || q.includes('contact')) {
      return {
        text: `👤 **Connect with AbKharido Human Support Agent:**\n\n` +
              `• 📱 **WhatsApp Support:** Instant live chat on **+91 9172600587**\n` +
              `• ✉️ **Email Desk:** **support@abkharido.com**\n` +
              `• ⏰ **Operating Hours:** 24x7 Priority Assistance for Verified Customers`,
        chips: [
          { id: 'open_wa', label: '💬 Open WhatsApp Live Chat Now', action: 'human' },
          { id: 'contact_page', label: '📞 Open Contact Page', link: '/contact' }
        ]
      };
    }

    // 7. General Friendly / Fallback AI
    return {
      text: `I understand! How can I best assist you with **"${query}"**? Choose a quick action below or connect with our live customer desk on WhatsApp:`,
      chips: [
        { id: 'track_order', label: '📦 Track My Order', action: 'track_order' },
        { id: 'coupons', label: '🏷️ Active Discount Coupons', action: 'coupons' },
        { id: 'returns', label: '🔄 Returns & Cancellations', action: 'returns' },
        { id: 'human', label: '💬 Chat with Human Support', action: 'human' }
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

    // Simulate smart thinking delay
    setTimeout(() => {
      const response = getBotResponse(query);
      const botMsg = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: response.text,
        orderData: response.orderData,
        couponCodes: response.couponCodes,
        chips: response.chips,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
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
    } else if (chip.action === 'returns') {
      handleSendMessage('How do I return or cancel an order?');
    } else if (chip.action === 'seller') {
      handleSendMessage('How can I become a seller on AbKharido?');
    }
  };

  return (
    <>
      {/* 🟢 FLOATING AI BOT TRIGGER BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="ai-support-floating-btn"
          aria-label="Open AbKharido AI Customer Support Assistant"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 50,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #3b82f6 100%)',
            color: '#ffffff',
            height: '48px',
            borderRadius: '28px',
            padding: '0 16px 0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(67, 56, 202, 0.35)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            fontFamily: "'Outfit', sans-serif"
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(67, 56, 202, 0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(67, 56, 202, 0.35)'; }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%' }}>
              <Bot size={20} color="#ffffff" />
            </div>
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', border: '2px solid #ffffff' }}></span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', lineHeight: 1.1 }}>AbKharido AI</div>
            <div style={{ fontSize: '10px', color: '#a5b4fc', fontWeight: '700' }}>24/7 Live Help</div>
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
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 40px)',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 99999,
            overflow: 'hidden',
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%)',
            padding: '16px 18px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setMessages([defaultGreeting])}
                title="Reset Chat"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Support"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            background: 'radial-gradient(circle at top, #f8fafc 0%, #f1f5f9 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
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
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, #4338ca 0%, #3b82f6 100%)' : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  boxShadow: msg.sender === 'user' ? '0 4px 14px rgba(67, 56, 202, 0.25)' : '0 2px 10px rgba(0,0,0,0.05)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  whiteSpace: 'pre-line'
                }}>
                  {msg.text}

                  {/* Embedded Coupon Chips if available */}
                  {msg.couponCodes && msg.couponCodes.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {msg.couponCodes.map((code) => (
                        <div 
                          key={code}
                          onClick={() => handleCopyCoupon(code)}
                          style={{
                            background: '#f8fafc',
                            border: '1.5px dashed #4f46e5',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            color: '#1e1b4b',
                            fontWeight: '800'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Tag size={13} color="#4f46e5" />
                            <span>{code}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: copiedCoupon === code ? '#16a34a' : '#4f46e5', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {copiedCoupon === code ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Code</>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Action Chips below Bot Message */}
                {msg.chips && msg.chips.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px', maxWidth: '90%' }}>
                    {msg.chips.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => handleChipClick(chip)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '16px',
                          padding: '6px 12px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          color: '#1e293b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#1e293b'; }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#ffffff', borderRadius: '16px', width: 'fit-content', border: '1px solid #e2e8f0' }}>
                <Bot size={15} color="#4f46e5" />
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>AI Assistant is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Footer Links */}
          <div style={{ padding: '8px 14px', background: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
            <span>⚡ Instant Automated Resolution</span>
            <a 
              href={`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent('Hello AbKharido Support! I need human agent assistance.')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#16a34a', fontWeight: '800', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <MessageCircle size={12} /> WhatsApp Desk
            </a>
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
              placeholder="Ask anything (e.g. Track order, coupons...)"
              style={{
                flex: 1,
                border: '1.5px solid #e2e8f0',
                borderRadius: '20px',
                padding: '10px 16px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: "'Outfit', sans-serif"
              }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              style={{
                background: inputValue.trim() ? 'linear-gradient(135deg, #4338ca 0%, #3b82f6 100%)' : '#e2e8f0',
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
