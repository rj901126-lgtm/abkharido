import React from 'react';
import Link from 'next/link';
import { PhoneCall, Mail, MessageSquare, ChevronRight } from 'lucide-react';

const Footer = ({ onNavigate }) => {
  const handleNav = (e, path) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <footer
      role="contentinfo"
      aria-label="Site Footer"
      style={{
        backgroundColor: '#0b0f19',
        color: '#94a3b8',
        borderTop: '1px solid #1e293b',
        fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
        marginTop: '36px',
        paddingBottom: 'calc(90px + env(safe-area-inset-bottom))'
      }}
    >
      {/* Main Corporate Links Section */}
      <div
        className="container"
        style={{
          padding: '40px 16px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '28px'
        }}
      >
        {/* Brand & Direct Contact Pillar */}
        <div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div
              style={{
                fontSize: '21px',
                fontWeight: '900',
                color: '#ffffff',
                letterSpacing: '-0.5px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span>AbKharido</span>
              <span style={{ color: '#38bdf8', fontSize: '16px' }}>.com</span>
            </div>
          </Link>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '12.5px',
              lineHeight: '1.55',
              marginBottom: '16px',
              fontWeight: '500'
            }}
          >
            India’s trusted direct-to-consumer &amp; verified marketplace with 100% escrow protection and AB Coins rewards.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12px',
              color: '#cbd5e1',
              fontWeight: '600'
            }}
          >
            <a
              href="tel:+919172600587"
              style={{
                color: '#cbd5e1',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <PhoneCall size={13} color="#38bdf8" />
              <span>+91 9172600587 (Mon–Sat 9AM–8PM)</span>
            </a>
            <a
              href="https://wa.me/919172600587?text=Hi%20AbKharido%20Support"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#cbd5e1',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.15)'
              }}
            >
              <MessageSquare size={13} color="#34d399" />
              <span>WhatsApp Support (9AM–9PM IST)</span>
            </a>
            <a
              href="mailto:support@abkharido.com"
              style={{
                color: '#cbd5e1',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <Mail size={13} color="#fbbf24" />
              <span>support@abkharido.com</span>
            </a>
          </div>
        </div>

        {/* Shopping Categories */}
        <div>
          <h4
            style={{
              color: '#f8fafc',
              fontSize: '12.5px',
              fontWeight: '800',
              marginBottom: '14px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}
          >
            Shop Categories
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '12.5px', fontWeight: '600' }}>
            {[
              { label: 'Smartphones & 5G Devices', path: 'mobiles' },
              { label: 'Electronics & Audio', path: 'electronics' },
              { label: 'Fashion & Lifestyle', path: 'fashion' },
              { label: 'Home & Kitchen', path: 'categories' },
              { label: 'VIP Vault Offers', path: 'vip' }
            ].map((item, i) => (
              <Link
                key={i}
                href={`/${item.path}`}
                onClick={(e) => handleNav(e, item.path)}
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'color 0.2s'
                }}
              >
                <ChevronRight size={12} color="#64748b" /> {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Customer Protection */}
        <div>
          <h4
            style={{
              color: '#f8fafc',
              fontSize: '12.5px',
              fontWeight: '800',
              marginBottom: '14px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}
          >
            Customer Care &amp; Policies
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '12.5px', fontWeight: '600' }}>
            {[
              { label: 'Track Your Order Live', path: 'orders' },
              { label: 'Easy 7-Day Replacement', path: 'returns' },
              { label: 'Shipping & Delivery Policy', path: 'shipping' },
              { label: 'Terms of Use', path: 'terms' },
              { label: 'Privacy Policy', path: 'privacy' },
              { label: 'Customer Help & FAQ', path: 'faq' },
              { label: 'Contact Support Team', path: 'contact' }
            ].map((item, idx) => (
              <Link
                key={idx}
                href={`/${item.path}`}
                onClick={(e) => handleNav(e, item.path)}
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <ChevronRight size={12} color="#64748b" /> {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Creator Economy & Merchant Portals */}
        <div>
          <h4
            style={{
              color: '#f8fafc',
              fontSize: '12.5px',
              fontWeight: '800',
              marginBottom: '14px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}
          >
            Partner With Us
          </h4>
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.07)',
              marginBottom: '10px'
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#f8fafc', marginBottom: '4px' }}>
              Creator &amp; Seller Ecosystem
            </div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.45', marginBottom: '10px' }}>
              Sell directly on AbKharido or share store links to earn commissions.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                href="/seller"
                onClick={(e) => handleNav(e, 'seller')}
                style={{
                  flex: 1,
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  textDecoration: 'none'
                }}
              >
                Seller Hub
              </Link>
              <Link
                href="/partner"
                onClick={(e) => handleNav(e, 'partner')}
                style={{
                  flex: 1,
                  background: '#1e293b',
                  color: '#f8fafc',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  textDecoration: 'none'
                }}
              >
                Creator Portal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible SEO & Popular Shopping Searches Directory */}
      <div className="container" style={{ padding: '0 16px 24px' }}>
        <details
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            padding: '10px 14px',
            cursor: 'pointer'
          }}
        >
          <summary
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              outline: 'none'
            }}
          >
            <span>Popular Searches &amp; Serviceable Cities Across India</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Expand ▾</span>
          </summary>

          <div
            style={{
              marginTop: '14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              cursor: 'default'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Trending Tech
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
                {[
                  'Smartwatches under 5000',
                  'ANC Wireless Earbuds',
                  '5G Smartphones',
                  'Fast Charging Power Banks',
                  'Bluetooth Speakers'
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href="/catalog"
                    onClick={(e) => handleNav(e, 'catalog')}
                    style={{
                      color: '#cbd5e1',
                      textDecoration: 'none',
                      background: 'rgba(255,255,255,0.04)',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Fashion &amp; Lifestyle
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
                {[
                  "Men's Oversized T-Shirts",
                  "Women's Kurti Sets",
                  'Running Shoes',
                  'Polarized Sunglasses',
                  'Chronograph Watches'
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href="/catalog"
                    onClick={(e) => handleNav(e, 'catalog')}
                    style={{
                      color: '#cbd5e1',
                      textDecoration: 'none',
                      background: 'rgba(255,255,255,0.04)',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Express Delivery Cities
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                {['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat'].map(
                  (city, idx) => (
                    <span key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '3px 8px', borderRadius: '6px' }}>
                      {city}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Payment Security & Copyright Footer Strip */}
      <div style={{ backgroundColor: '#070a12', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '500' }}>
            <strong style={{ color: '#cbd5e1', fontWeight: '700' }}>AbKharido Retail Pvt. Ltd.</strong> • Palghar, Maharashtra, India • © 2026 AbKharido.com
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {['UPI', 'RuPay', 'Visa', 'MasterCard', 'COD'].map((pay, idx) => (
              <span
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: '#94a3b8',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  fontSize: '10.5px',
                  fontWeight: '700',
                  border: '1px solid rgba(255,255,255,0.07)'
                }}
              >
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
