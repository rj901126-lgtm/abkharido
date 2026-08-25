import React from 'react';
import Link from 'next/link';
import { Award, ShieldCheck, PhoneCall, Mail, MessageSquare, ChevronRight, Lock, Zap } from 'lucide-react';

const Footer = ({ onNavigate }) => {
  const handleNav = (e, path) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <footer style={{ backgroundColor: '#090d16', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", marginTop: '60px' }}>
      {/* Top Value Assurance Ribbon */}
      <div style={{ background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <div className="navbar-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'white' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={26} color="#34d399" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px' }}>100% Cashfree Protected</div>
              <div style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '500' }}>Bank-grade escrow refund security</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'white' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={26} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px' }}>Priority Express Dispatch</div>
              <div style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '500' }}>Fast and safe doorstep delivery across India</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'white' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={26} color="#fde047" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px' }}>Instant AB Coins Cashback</div>
              <div style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '500' }}>1 Coin = ₹1 spendable discount</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'white' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={26} color="#e879f9" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px' }}>Easy 7-Day Replacement</div>
              <div style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '500' }}>Hassle-free doorstep returns</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Corporate Mega-Links Section */}
      <div className="navbar-container" style={{ padding: '60px 20px 50px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px' }}>
        
        {/* Brand & Corporate Pillar */}
        <div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '26px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>AbKharido</span>
              <span style={{ color: '#38bdf8', fontSize: '20px' }}>.com</span>
            </div>
          </Link>
          <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px', fontWeight: '500' }}>
            India’s trusted direct shopping destination with 100% genuine inventory and instant AB Coins reward points.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#e2e8f0', fontWeight: '700' }}>
            <a href="tel:+919172600587" style={{ color: '#e2e8f0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PhoneCall size={16} color="#38bdf8" /> <span>+91 9172600587 (Mon-Sat 9AM-8PM)</span>
            </a>
            <a href="https://wa.me/919172600587?text=Hi%20AbKharido%20Support" target="_blank" rel="noopener noreferrer" style={{ color: '#e2e8f0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={16} color="#34d399" /> <span>WhatsApp Support 24/7</span>
            </a>
            <a href="mailto:support@abkharido.com" style={{ color: '#e2e8f0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={16} color="#fde047" /> <span>support@abkharido.com</span>
            </a>
          </div>
        </div>

        {/* Shopping Categories */}
        <div>
          <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '900', marginBottom: '20px', letterSpacing: '0.5px', textTransform: 'uppercase', borderLeft: '3px solid #6366f1', paddingLeft: '10px' }}>
            Popular Categories
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', fontWeight: '600' }}>
            {[
              { label: "Smartphones & 5G Devices", path: "catalog?category=mobiles" },
              { label: "Electronics & Audio", path: "catalog?category=electronics" },
              { label: "Fashion & Lifestyle", path: "catalog?category=fashion" },
              { label: "Home & Kitchen", path: "catalog?category=home" },
              { label: "Appliances & Living", path: "catalog?category=appliances" },
              { label: "VIP Vault Offers", path: "catalog?tag=vip" }
            ].map((item, i) => (
              <Link key={i} href={`/${item.path}`} onClick={(e) => handleNav(e, item.path)} style={{ color: '#cbd5e1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}>
                <ChevronRight size={14} color="#6366f1" /> {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Customer Trust & Policies */}
        <div>
          <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '900', marginBottom: '20px', letterSpacing: '0.5px', textTransform: 'uppercase', borderLeft: '3px solid #34d399', paddingLeft: '10px' }}>
            Customer Protection
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', fontWeight: '600' }}>
            {[
              { label: "Track Your Order Live", path: "orders" },
              { label: "Easy 7-Day Replacement", path: "returns" },
              { label: "Shipping & Delivery Policy", path: "shipping" },
              { label: "Terms of Service", path: "terms" },
              { label: "Privacy Policy", path: "privacy" },
              { label: "About AbKharido", path: "about" },
              { label: "Customer Help & FAQ", path: "faq" },
              { label: "Contact Support Team", path: "contact" }
            ].map((item, idx) => (
              <Link key={idx} href={`/${item.path}`} onClick={(e) => handleNav(e, item.path)} style={{ color: '#cbd5e1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ChevronRight size={14} color="#34d399" /> {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Creator Economy & Support */}
        <div>
          <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '900', marginBottom: '20px', letterSpacing: '0.5px', textTransform: 'uppercase', borderLeft: '3px solid #fde047', paddingLeft: '10px' }}>
            Earn & Partner
          </h4>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fde047', marginBottom: '6px' }}>👑 Creator Commission Program</div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '12px' }}>Share verified store product links and earn real withdrawable cash commissions.</p>
            <Link href="/partner" onClick={(e) => handleNav(e, 'partner')} style={{ display: 'block', textAlign: 'center', background: '#fde047', color: '#090d16', fontWeight: '900', textDecoration: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', width: '100%' }}>
              Launch Creator Portal
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/seller" onClick={(e) => handleNav(e, 'seller')} style={{ flex: 1, background: '#1e293b', color: 'white', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)', fontSize: '12px', fontWeight: '800', textDecoration: 'none' }}>
              🏬 Sell on AbKharido
            </Link>
            <Link href="/faq" onClick={(e) => handleNav(e, 'faq')} style={{ flex: 1, background: '#1e293b', color: 'white', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)', fontSize: '12px', fontWeight: '800', textDecoration: 'none' }}>
              ❓ Help &amp; FAQs
            </Link>
          </div>
        </div>

      </div>

      {/* Payment Security & Copyright Footer Strip */}
      <div style={{ backgroundColor: '#05080e', padding: '28px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="navbar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500', lineHeight: 1.6 }}>
            <strong style={{ color: '#ffffff', fontWeight: '800' }}>AbKharido Retail Private Limited</strong> • CIN: U52100DL2024PTC394821 • Registered in New Delhi, India.
            <div style={{ fontSize: '12px', color: '#64748b' }}>© 2026 AbKharido.com. 100% Genuine Direct Buy & Earn Destination. All rights reserved.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '800' }}>100% SECURE CHECKOUT:</span>
            {["UPI (GPay / PhonePe / Paytm)", "RuPay", "Visa", "MasterCard", "NetBanking", "Cash on Delivery", "Cashfree Escrow"].map((pay, idx) => (
              <span key={idx} style={{ background: '#1e293b', color: '#ffffff', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', border: '1px solid rgba(255,255,255,0.15)' }}>
                🔒 {pay}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
