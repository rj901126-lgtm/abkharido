import React from 'react';
import { ShoppingBag, Award, Heart, HelpCircle, ShieldCheck } from 'lucide-react';

const Footer = ({ onNavigate }) => {
  return (
    <footer className="app-footer" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#94a3b8', fontSize: '13px', marginTop: 'auto' }}>
      {/* Newsletter Section */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '60px 0' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '32px' }}>
          <div>
            <h3 style={{ color: 'white', fontSize: '24px', fontWeight: '800', marginBottom: '8px', letterSpacing: '0.5px' }}>Join the AbKharido Club</h3>
            <p style={{ color: '#94a3b8', fontSize: '15px' }}>Get exclusive early access to deals, product drops, and insider rewards.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              style={{ flex: 1, padding: '14px 16px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'white', outline: 'none', fontSize: '14px' }}
            />
            <button style={{ padding: '0 28px', borderRadius: '8px', background: '#4f46e5', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#4338ca'} onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Upper footer features */}
      <div style={{ padding: '60px 0' }}>
        <div className="container footer-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
          <div className="footer-feature-item" style={{ display: 'flex', gap: '16px', color: 'white', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px', color: '#818cf8' }}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>100% Direct Sales</h4>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>No 3rd party sellers. Direct inventory & guaranteed warranty.</p>
            </div>
          </div>
          <div className="footer-feature-item" style={{ display: 'flex', gap: '16px', color: 'white', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px', color: '#818cf8' }}>
              <Award size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Affiliate Program</h4>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>Share products & earn up to 7% instant cash commission.</p>
            </div>
          </div>
          <div className="footer-feature-item" style={{ display: 'flex', gap: '16px', color: 'white', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px', color: '#818cf8' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Secure Payments</h4>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>Netbanking, UPI, Cards, and Cash on Delivery options.</p>
            </div>
          </div>
          <div className="footer-feature-item" style={{ display: 'flex', gap: '16px', color: 'white', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px', color: '#818cf8' }}>
              <HelpCircle size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>24/7 Priority Support</h4>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>Rapid resolution directly handled by our service crew.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main links block removed as they are shifted to the profile tab info sections */}

      {/* Footer Bottom copyright */}
      <div className="footer-bottom-bar" style={{ backgroundColor: '#020617', padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ color: '#475569', fontSize: '13px' }}>© 2026 AbKharido.com. All rights reserved. Self-Operated Premium E-Commerce Platform.</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', fontWeight: '500' }}>
            Made with <Heart size={14} color="#ef4444" fill="#ef4444" /> for Smart Shoppers & Creators.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
