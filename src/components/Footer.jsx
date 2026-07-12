import React from 'react';
import { ShoppingBag, Award, Heart, HelpCircle, ShieldCheck } from 'lucide-react';

const Footer = ({ onNavigate }) => {
  return (
    <footer style={styles.footer}>
      {/* Upper footer features */}
      <div style={styles.featuresSection}>
        <div className="container" style={styles.featuresGrid}>
          <div style={styles.featureItem}>
            <ShoppingBag size={22} color="#ffe500" />
            <div>
              <h4 style={styles.featureTitle}>100% Direct Sales</h4>
              <p style={styles.featureDesc}>No 3rd party sellers. Direct inventory & warranty.</p>
            </div>
          </div>
          <div style={styles.featureItem}>
            <Award size={22} color="#ffe500" />
            <div>
              <h4 style={styles.featureTitle}>Affiliate Program</h4>
              <p style={styles.featureDesc}>Share links & earn up to 7% commission.</p>
            </div>
          </div>
          <div style={styles.featureItem}>
            <ShieldCheck size={22} color="#ffe500" />
            <div>
              <h4 style={styles.featureTitle}>Secure Payments</h4>
              <p style={styles.featureDesc}>Netbanking, UPI, Cards, and COD options.</p>
            </div>
          </div>
          <div style={styles.featureItem}>
            <HelpCircle size={22} color="#ffe500" />
            <div>
              <h4 style={styles.featureTitle}>24/7 Dedicated Support</h4>
              <p style={styles.featureDesc}>Rapid resolution directly by our service crew.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container" style={styles.linksGrid}>
        <div>
          <h5 style={styles.heading}>ABOUT ABKHARIDO</h5>
          <ul style={styles.list}>
            <li style={styles.listItem}><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('info-contact'); }}>Contact Us</a></li>
            <li style={styles.listItem}><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('info-about'); }}>About Us</a></li>
            <li style={styles.listItem}><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('info-contact'); }}>Careers</a></li>
            <li style={styles.listItem}><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('info-contact'); }}>Wholesale Enquiries</a></li>
          </ul>
        </div>
        <div>
          <h5 style={styles.heading}>PARTNERSHIPS</h5>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <a href="#partners" onClick={(e) => { e.preventDefault(); onNavigate('partner'); }}>
                Affiliate Dashboard
              </a>
            </li>
            <li style={styles.listItem}>
              <a href="#creator-program" onClick={(e) => { e.preventDefault(); onNavigate('partner'); }}>
                Become a Creator (7% Cash)
              </a>
            </li>
            <li style={styles.listItem}>
              <a href="#referrals" onClick={(e) => { e.preventDefault(); onNavigate('partner'); }}>
                Refer a Friend (3% Coins)
              </a>
            </li>
            <li style={styles.listItem}><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('info-terms'); }}>Affiliate Guidelines</a></li>
          </ul>
        </div>
        <div>
          <h5 style={styles.heading}>HELP & POLICIES</h5>
          <ul style={styles.list}>
            <li style={styles.listItem}><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('info-terms'); }}>Payments & Refunds</a></li>
            <li style={styles.listItem}><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('info-contact'); }}>Shipping & Delivery</a></li>
            <li style={styles.listItem}><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('info-returns'); }}>Cancellation & Returns</a></li>
            <li style={styles.listItem}><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('info-privacy'); }}>Terms of Use & Privacy</a></li>
          </ul>
        </div>
        <div>
          <h5 style={styles.heading}>DIRECT FULFILLMENT HUB</h5>
          <p style={styles.fulfillmentText}>
            <strong>AbKharido Retail Private Limited</strong><br />
            Outer Ring Road, Devarabeesanahalli Village,<br />
            Bengaluru, Karnataka - 560103.<br />
            CIN: U72900KA2026PTC998877<br />
            Email: help@abkharido.com
          </p>
        </div>
      </div>

      {/* Footer Bottom copyright */}
      <div style={styles.bottomBar}>
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
    backgroundColor: '#172337',
    color: '#878787',
    fontSize: '12px',
    marginTop: 'auto',
  },
  featuresSection: {
    borderBottom: '1px solid #2e3e54',
    padding: '24px 0',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
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
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
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
    backgroundColor: '#101724',
    padding: '20px 0',
    borderTop: '1px solid #243040',
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
