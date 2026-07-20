import React from 'react';
import { ShoppingBag, Award, Heart, HelpCircle, ShieldCheck } from 'lucide-react';

const Footer = ({ onNavigate }) => {
  return (
    <footer className="app-footer" style={styles.footer}>
      {/* Newsletter Section */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '40px 0' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <div>
            <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Join the AbKharido Club</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Get exclusive early access to deals, product drops, and insider rewards.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
            />
            <button style={{ padding: '0 24px', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Upper footer features */}
      <div style={styles.featuresSection}>
        <div className="container footer-features-grid" style={styles.featuresGrid}>
          <div className="footer-feature-item" style={styles.featureItem}>
            <ShoppingBag size={24} color="#818cf8" />
            <div>
              <h4 style={styles.featureTitle}>100% Direct Sales</h4>
              <p style={styles.featureDesc}>No 3rd party sellers. Direct inventory & warranty.</p>
            </div>
          </div>
          <div className="footer-feature-item" style={styles.featureItem}>
            <Award size={24} color="#818cf8" />
            <div>
              <h4 style={styles.featureTitle}>Affiliate Program</h4>
              <p style={styles.featureDesc}>Share links & earn up to 7% commission.</p>
            </div>
          </div>
          <div className="footer-feature-item" style={styles.featureItem}>
            <ShieldCheck size={24} color="#818cf8" />
            <div>
              <h4 style={styles.featureTitle}>Secure Payments</h4>
              <p style={styles.featureDesc}>Netbanking, UPI, Cards, and COD options.</p>
            </div>
          </div>
          <div className="footer-feature-item" style={styles.featureItem}>
            <HelpCircle size={24} color="#818cf8" />
            <div>
              <h4 style={styles.featureTitle}>24/7 Dedicated Support</h4>
              <p style={styles.featureDesc}>Rapid resolution directly by our service crew.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main links block removed as they are shifted to the profile tab info sections */}

      {/* Footer Bottom copyright */}
      <div className="footer-bottom-bar" style={styles.bottomBar}>
        <div className="container" style={styles.bottomContent}>
          <p>© 2026 AbKharido.com. All rights reserved. Self-Operated E-Commerce Platform.</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Made with <Heart size={14} color="#f44336" fill="#f44336" /> for Smart Shoppers & Creators.
          </p>
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: 'var(--accent-color)',
    color: '#94a3b8',
    fontSize: '13px',
    marginTop: 'auto',
  },
  featuresSection: {
    padding: '40px 0',
  },
  featuresGrid: {
    gap: '24px',
  },
  featureItem: {
    display: 'flex',
    gap: '12px',
    color: 'white',
  },
  featureTitle: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '2px',
  },
  featureDesc: {
    color: '#a3a3a3',
    fontSize: '12px',
  },
  linksGrid: {
    gap: '32px',
    paddingTop: '40px',
    paddingBottom: '40px',
  },
  heading: {
    color: '#a3a3a3',
    fontWeight: '600',
    fontSize: '12px',
    marginBottom: '12px',
    letterSpacing: '0.5px',
  },
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  listItem: {
    color: 'white',
    fontSize: '13px',
  },
  fulfillmentText: {
    color: '#cccccc',
    lineHeight: '1.6',
    fontSize: '13px',
  },
  bottomBar: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: '24px 0',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    textAlign: 'center',
  },
  bottomContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
};

// Add media query inline support if needed, but since it's desktop grid, grid responsiveness can be handled in stylesheet if needed.
// To keep it simple, the layout works well.

export default Footer;
