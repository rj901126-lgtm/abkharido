import React from 'react';
import Link from 'next/link';
import { Award, ShieldCheck, PhoneCall, Mail, MessageSquare, ChevronRight, Lock, Zap, CheckCircle2 } from 'lucide-react';

const Footer = ({ onNavigate }) => {
  const handleNav = (e, path) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <footer style={{
      backgroundColor: '#070a12',
      color: '#94a3b8',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
      marginTop: '40px',
      paddingBottom: 'calc(105px + env(safe-area-inset-bottom))'
    }}>
      {/* 🌟 Top Value Assurance Ribbon — Responsive 2x2 on Mobile, 4-Col on Desktop */}
      <div style={{ background: 'linear-gradient(135deg, #090d16 0%, #17153b 50%, #1e1b4b 100%)', padding: '28px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={22} color="#34d399" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#ffffff' }}>100% Escrow Protected</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>Safe bank-grade refund guarantee</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(2, 132, 199, 0.2) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={22} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#ffffff' }}>Priority Express Dispatch</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>Free fast delivery across India</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={22} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#ffffff' }}>Instant AB Coins</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>1 Coin = ₹1 instant savings</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(232, 121, 249, 0.2) 0%, rgba(192, 38, 211, 0.2) 100%)', border: '1px solid rgba(232, 121, 249, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={22} color="#e879f9" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#ffffff' }}>Easy 7-Day Replacement</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>Zero hassle doorstep returns</div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Corporate Mega-Links Section */}
      <div className="container" style={{ padding: '48px 16px 36px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '32px' }}>
        
        {/* Brand & Direct Contact Pillar */}
        <div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>AbKharido</span>
              <span style={{ color: '#38bdf8', fontSize: '18px' }}>.com</span>
            </div>
          </Link>
          <p style={{ color: '#94a3b8', fontSize: '12.5px', lineHeight: '1.6', marginBottom: '18px', fontWeight: '500' }}>
            India’s trusted direct-to-consumer shopping platform with 100% genuine inventory &amp; AB Coins rewards.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#e2e8f0', fontWeight: '700' }}>
            <a href="tel:+919172600587" style={{ color: '#e2e8f0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <PhoneCall size={14} color="#38bdf8" /> <span>+91 9172600587 (Mon-Sat 9AM-8PM)</span>
            </a>
            <a href="https://wa.me/919172600587?text=Hi%20AbKharido%20Support" target="_blank" rel="noopener noreferrer" style={{ color: '#e2e8f0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(37, 211, 102, 0.1)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(37, 211, 102, 0.2)' }}>
              <MessageSquare size={14} color="#34d399" /> <span>WhatsApp Support 24/7</span>
            </a>
            <a href="mailto:support@abkharido.com" style={{ color: '#e2e8f0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Mail size={14} color="#fbbf24" /> <span>support@abkharido.com</span>
            </a>
          </div>
        </div>

        {/* Shopping Categories */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '900', marginBottom: '16px', letterSpacing: '0.4px', textTransform: 'uppercase', borderLeft: '3px solid #6366f1', paddingLeft: '8px' }}>
            Popular Categories
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', fontWeight: '600' }}>
            {[
              { label: "Smartphones & 5G Devices", path: "mobiles" },
              { label: "Electronics & Audio", path: "electronics" },
              { label: "Fashion & Lifestyle", path: "fashion" },
              { label: "Home & Kitchen", path: "categories" },
              { label: "VIP Vault Offers", path: "vip" }
            ].map((item, i) => (
              <Link key={i} href={`/${item.path}`} onClick={(e) => handleNav(e, item.path)} style={{ color: '#cbd5e1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}>
                <ChevronRight size={13} color="#6366f1" /> {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Customer Protection */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '900', marginBottom: '16px', letterSpacing: '0.4px', textTransform: 'uppercase', borderLeft: '3px solid #34d399', paddingLeft: '8px' }}>
            Customer Protection
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', fontWeight: '600' }}>
            {[
              { label: "Track Your Order Live", path: "orders" },
              { label: "Easy 7-Day Replacement", path: "returns" },
              { label: "Shipping & Delivery Policy", path: "shipping" },
              { label: "Terms & Privacy Policy", path: "privacy" },
              { label: "Customer Help & FAQ", path: "faq" },
              { label: "Contact Support Team", path: "contact" }
            ].map((item, idx) => (
              <Link key={idx} href={`/${item.path}`} onClick={(e) => handleNav(e, item.path)} style={{ color: '#cbd5e1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ChevronRight size={13} color="#34d399" /> {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Creator Economy & Merchant Portals */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '900', marginBottom: '16px', letterSpacing: '0.4px', textTransform: 'uppercase', borderLeft: '3px solid #fbbf24', paddingLeft: '8px' }}>
            Earn &amp; Partner
          </h4>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#fbbf24', marginBottom: '4px' }}>👑 Creator Commission Hub</div>
            <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '10px' }}>Share store links and earn instant withdrawable cash commissions.</p>
            <Link href="/partner" onClick={(e) => handleNav(e, 'partner')} style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#090d16', fontWeight: '900', textDecoration: 'none', padding: '7px 12px', borderRadius: '8px', fontSize: '11.5px', cursor: 'pointer' }}>
              Launch Creator Portal
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/seller" onClick={(e) => handleNav(e, 'seller')} style={{ flex: 1, background: '#1e293b', color: 'white', padding: '8px 10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)', fontSize: '11.5px', fontWeight: '800', textDecoration: 'none' }}>
              🏬 Seller Hub
            </Link>
            <Link href="/faq" onClick={(e) => handleNav(e, 'faq')} style={{ flex: 1, background: '#1e293b', color: 'white', padding: '8px 10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)', fontSize: '11.5px', fontWeight: '800', textDecoration: 'none' }}>
              ❓ Help Center
            </Link>
          </div>
        </div>

      </div>

      {/* Payment Security & Copyright Footer Strip */}
      <div style={{ backgroundColor: '#05070d', padding: '20px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', lineHeight: 1.5 }}>
            <strong style={{ color: '#ffffff', fontWeight: '800' }}>AbKharido Retail Private Limited</strong> • Registered in New Delhi, India.
            <div style={{ fontSize: '11px', color: '#64748b' }}>© 2026 AbKharido.com. 100% Genuine Direct Buy &amp; Earn Destination. All rights reserved.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '800' }}>🔒 100% SECURE:</span>
            {["UPI (GPay / PhonePe)", "RuPay", "Visa", "MasterCard", "Cash on Delivery"].map((pay, idx) => (
              <span key={idx} style={{ background: '#1e293b', color: '#ffffff', padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)' }}>
                {pay}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
