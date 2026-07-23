import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Award, 
  Share2, 
  Coins, 
  DollarSign, 
  MousePointer, 
  ShoppingBag, 
  Sparkles, 
  Copy, 
  Check, 
  Send,
  Building,
  UserCheck,
  TrendingUp,
  FileText
} from 'lucide-react';
import '../assets/styles/partner.css';

const PartnerCenter = () => {
  const { currentUser, partnerStats, registerAsInfluencer, requestPayout, showToast, products } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // overview, generator, history, payouts

  // Copy states
  const [copiedLink, setCopiedLink] = useState('');
  
  // Registration Form States
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [handleName, setHandleName] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [followers, setFollowers] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiId, setUpiId] = useState('');

  // Link Generator States
  const [selectedProdId, setSelectedProdId] = useState(products && products.length > 0 ? products[0].id : '');

  // Withdrawal States
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');

  if (!currentUser) {
    return (
      <div className="container animate-fade-in" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Partner Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Please log in to open the Partner dashboard center.</p>
      </div>
    );
  }

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLink(key);
      showToast('Referral link copied!', 'success');
      setTimeout(() => setCopiedLink(''), 2000);
    });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!handleName || !followers || (!upiId && !bankAcc)) {
      showToast('Please fill out all required social/payment details.', 'error');
      return;
    }

    const cleanId = handleName.toLowerCase().replace(/[@\s]/g, '');
    registerAsInfluencer(cleanId, {
      upi: upiId,
      bankAccount: bankAcc,
      bankIfsc: bankIfsc
    });
    setShowRegisterForm(false);
    setActiveTab('overview');
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid withdrawal amount.', 'error');
      return;
    }
    
    const success = requestPayout(
      amountNum, 
      withdrawMethod === 'upi' ? `UPI: ${currentUser.payoutDetails.upi || 'Default'}` : `Bank: ${currentUser.payoutDetails.bankAccount || 'Default'}`
    );

    if (success) {
      setWithdrawAmount('');
    }
  };

  // Calculations for stats
  const totalReferredOrdersAmount = partnerStats.history.reduce((acc, item) => acc + item.amount, 0);
  const totalCommissionEarned = partnerStats.history.reduce((acc, item) => acc + item.earnings, 0);
  const pendingEarnings = partnerStats.history
    .filter(item => item.status === 'Pending')
    .reduce((acc, item) => acc + item.earnings, 0);

  const getStorewideLink = () => {
    const origin = window.location.origin;
    return currentUser.isInfluencer 
      ? `${origin}/?aff=${currentUser.creatorCode || 'AFF-TEMP'}` 
      : `${origin}/?ref=${currentUser.referralCode || 'REF-TEMP'}`;
  };

  const getSelectedProductLink = () => {
    const origin = window.location.origin;
    const tracking = currentUser.isInfluencer 
      ? `aff=${currentUser.creatorCode || 'AFF-TEMP'}` 
      : `ref=${currentUser.referralCode || 'REF-TEMP'}`;
    return `${origin}/?prod=${selectedProdId}&${tracking}`;
  };

  return (
    <div className="container partner-container animate-fade-in">
      
      {/* 1. Profile Header bar */}
      <div className="partner-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>{currentUser.fullName}'s Partner Dashboard</h1>
            <span className={`badge ${currentUser.isInfluencer ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '11px' }}>
              {currentUser.isInfluencer ? 'Verified Creator' : 'Store Member'}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {currentUser.isInfluencer 
              ? `Creator ID: ${currentUser.influencerId} | Earning cash payouts on referred catalog sales.`
              : 'Refer friends to earn AbKharido Coins redeemable for store shopping discounts.'}
          </p>
        </div>
        
        {/* Quick Link Share */}
        <div className="share-link-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Your Storewide Referral Link:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              readOnly 
              value={getStorewideLink()} 
              className="share-link-input"
              style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid var(--border-light)', borderRadius: '4px', width: '220px', backgroundColor: '#fcfcfc' }}
            />
            <button 
              className="btn btn-primary" 
              style={{ padding: '0 12px' }}
              onClick={() => handleCopyText(getStorewideLink(), 'storewide')}
            >
              {copiedLink === 'storewide' ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* If Normal User and not influencer form: Show Pitch to upgrade to Influencer */}
      {!currentUser.isInfluencer && !showRegisterForm && (
        <section className="influencer-pitch-card">
          <div className="pitch-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={24} color="var(--secondary-color)" />
              <h2 className="pitch-title">Become an AbKharido Creator</h2>
            </div>
            <p className="pitch-desc">
              Do you have a social media channel, blog, or tech review page? Elevate your partnership! 
              Get approved for cash payouts directly to your UPI or Bank Account with commission rates up to 7%.
            </p>
            <ul className="pitch-perks-list">
              <li className="pitch-perk-item"><UserCheck size={16} color="var(--secondary-color)" /> <strong>Up to 7% Commission:</strong> Rates vary per product category (Fashion gets max 7%).</li>
              <li className="pitch-perk-item"><DollarSign size={16} color="var(--secondary-color)" /> <strong>Real Cash Withdrawals:</strong> Withdraw commissions directly once orders clear.</li>
              <li className="pitch-perk-item"><TrendingUp size={16} color="var(--secondary-color)" /> <strong>Affiliate Link Analytics:</strong> Track referred clicks, conversions, and transaction history.</li>
            </ul>
          </div>
          <div>
            <button className="btn btn-secondary btn-lg" onClick={() => setShowRegisterForm(true)}>
              Apply Now (Instant Auto-Approve)
            </button>
          </div>
        </section>
      )}

      {/* Influencer Application Form */}
      {showRegisterForm && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} color="var(--primary-color)" /> Creator Program Application Form</h2>
          <form onSubmit={handleRegisterSubmit} className="partner-form">
            <div className="form-group">
              <label className="form-label-txt">Instagram Handle or YouTube Channel Name*</label>
              <input 
                type="text" 
                placeholder="@username or ChannelName" 
                value={handleName} 
                onChange={(e) => setHandleName(e.target.value)}
                className="form-input-field"
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label-txt">Primary Channel Platform*</label>
                <select 
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value)}
                  className="form-input-field"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="blog">Blog / Website</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label-txt">Follower/Subscriber Count*</label>
                <input 
                  type="number" 
                  placeholder="e.g. 15000" 
                  value={followers} 
                  onChange={(e) => setFollowers(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>
            </div>

            <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '16px', marginTop: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Payout Information (Required for Cash Transfers)</h4>
              
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label-txt">UPI ID (Recommended)</label>
                <input 
                  type="text" 
                  placeholder="username@okaxis" 
                  value={upiId} 
                  onChange={(e) => setUpiId(e.target.value)}
                  className="form-input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label-txt">Bank Account Number</label>
                  <input 
                    type="text" 
                    placeholder="9988776655" 
                    value={bankAcc} 
                    onChange={(e) => setBankAcc(e.target.value)}
                    className="form-input-field"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label-txt">Bank IFSC Code</label>
                  <input 
                    type="text" 
                    placeholder="HDFC0000123" 
                    value={bankIfsc} 
                    onChange={(e) => setBankIfsc(e.target.value)}
                    className="form-input-field"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowRegisterForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Application</button>
            </div>
          </form>
        </div>
      )}

      {/* Main Dashboard Control Panel */}
      {!showRegisterForm && (
        <>
          {/* Dashboard Navigation Tabs */}
          <div className="dashboard-tabs-bar">
            <button 
              className={`dashboard-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`dashboard-tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
              onClick={() => setActiveTab('generator')}
            >
              Affiliate Links Generator
            </button>
            <button 
              className={`dashboard-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Referred Conversions ({partnerStats.history.length})
            </button>
            {currentUser.isInfluencer && (
              <button 
                className={`dashboard-tab-btn ${activeTab === 'payouts' ? 'active' : ''}`}
                onClick={() => setActiveTab('payouts')}
              >
                Withdraw Payouts
              </button>
            )}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Analytics Stats */}
              <div className="partner-stats-row">
                <div className="stat-card">
                  <div className="stat-icon-frame" style={{ backgroundColor: '#eff6ff' }}>
                    <MousePointer size={24} color="#1d4ed8" />
                  </div>
                  <div className="stat-data">
                    <span className="stat-val">{partnerStats.clicks}</span>
                    <span className="stat-lbl">Visits Referred</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-frame" style={{ backgroundColor: '#faf5ff' }}>
                    <ShoppingBag size={24} color="#7c3aed" />
                  </div>
                  <div className="stat-data">
                    <span className="stat-val">{partnerStats.conversions}</span>
                    <span className="stat-lbl">Purchases Made</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-frame" style={{ backgroundColor: '#fffbeb' }}>
                    <TrendingUp size={24} color="#d97706" />
                  </div>
                  <div className="stat-data">
                    <span className="stat-val">
                      {partnerStats.clicks > 0 
                        ? `${Math.round((partnerStats.conversions / partnerStats.clicks) * 100 * 10) / 10}%`
                        : '0%'}
                    </span>
                    <span className="stat-lbl">Conversion Rate</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-frame" style={{ backgroundColor: '#f0fdf4' }}>
                    {currentUser.isInfluencer ? <DollarSign size={24} color="var(--success)" /> : <Coins size={24} color="#e68f00" />}
                  </div>
                  <div className="stat-data">
                    <span className="stat-val">
                      {currentUser.isInfluencer ? `₹${currentUser.walletCash.toFixed(2)}` : `${currentUser.walletCoins}`}
                    </span>
                    <span className="stat-lbl">{currentUser.isInfluencer ? 'Withdrawable Cash' : 'AbKharido Coins'}</span>
                  </div>
                </div>
              </div>

              {/* Commission rules cards */}
              <div className="partner-info-grid">
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><Award size={16} color="var(--primary-color)" /> Commission Rates Breakdown</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Our B2C store rewards vary depending on the product category. Fashion products reward highest referral margins!
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="partner-table" style={{ width: '100%', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <th style={{ padding: '4px 0' }}>Category</th>
                        <th>User Coins</th>
                        <th>Creator Cash</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 0' }}>Fashion & Clothing</td>
                        <td style={{ color: '#e68f00', fontWeight: 'bold' }}>3.0%</td>
                        <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>7.0%</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0' }}>Home & Kitchen</td>
                        <td style={{ color: '#e68f00', fontWeight: 'bold' }}>2.0%</td>
                        <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>5.0%</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0' }}>Appliances</td>
                        <td style={{ color: '#e68f00', fontWeight: 'bold' }}>1.5%</td>
                        <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>4.0%</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0' }}>Electronics & Keyboards</td>
                        <td style={{ color: '#e68f00', fontWeight: 'bold' }}>1.2%</td>
                        <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>3.0%</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0' }}>Mobiles & Tablets</td>
                        <td style={{ color: '#e68f00', fontWeight: 'bold' }}>0.5%</td>
                        <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>2.0%</td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                </div>

                <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Share2 size={16} color="var(--primary-color)" /> How Referral Attribution Works</h3>
                  <ol style={{ fontSize: '13px', color: '#444', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.4' }}>
                    <li>Copy any store or product tracking link containing your partner parameters.</li>
                    <li>Share them on your social profiles, review blogs, or chat groups.</li>
                    <li>When a customer clicks your link, a secure referral session is locked in their browser.</li>
                    <li>If they checkout within that session, our platform awards you credit. (Regular user coins are approved immediately; Creator cash commissions remain pending for return windows).</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LINKS GENERATOR */}
          {activeTab === 'generator' && (
            <div className="dashboard-panel-card">
              <h3 className="panel-header-title">Generate Specific Product Tracking Links</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Select any product from our inventory to create a trackable affiliate URL.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '500px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Choose Product:</label>
                <select 
                  value={selectedProdId} 
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="form-input-field"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0', padding: '16px', borderRadius: '4px', marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <img 
                    src={products.find(p => p.id === selectedProdId)?.image || ''} 
                    alt="product preview" 
                    style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid #eee', padding: '2px', backgroundColor: 'white', borderRadius: '4px' }} 
                  />
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{products.find(p => p.id === selectedProdId)?.name || 'Product Not Found'}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Price: ₹{products.find(p => p.id === selectedProdId)?.price?.toLocaleString('en-IN') || 0} |{' '}
                      {currentUser.isInfluencer ? (
                        <span style={{ color: 'var(--success)' }}>Creator rate: {(products.find(p => p.id === selectedProdId)?.influencerCommissionRate || 0) * 100}%</span>
                      ) : (
                        <span style={{ color: '#e68f00' }}>User rate: {(products.find(p => p.id === selectedProdId)?.userCommissionRate || 0) * 100}%</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Your Affiliate Link:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={getSelectedProductLink()} 
                      style={{ flex: 1, padding: '10px 14px', fontSize: '13px', border: '1px solid var(--border-light)', borderRadius: '4px', backgroundColor: 'white' }}
                      onClick={(e) => e.target.select()}
                    />
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleCopyText(getSelectedProductLink(), 'product')}
                    >
                      {copiedLink === 'product' ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copiedLink === 'product' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="dashboard-panel-card">
              <h3 className="panel-header-title">Referred Conversions History</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Track purchases completed by shoppers who used your referral link.
              </p>

              {partnerStats.history.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="partner-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Referred Order ID</th>
                        <th>Product / Order Summary</th>
                        <th>Order Value</th>
                        <th>Commission Rate</th>
                        <th>Your Earnings</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerStats.history.map((txn, idx) => (
                        <tr key={idx}>
                          <td>{txn.date}</td>
                          <td><code>{txn.id}</code></td>
                          <td style={{ fontWeight: '500' }}>{txn.productName}</td>
                          <td>₹{txn.amount.toLocaleString('en-IN')}</td>
                          <td>{txn.rate === 'Dynamic' ? 'Dynamic' : `${txn.rate * 100}%`}</td>
                          <td style={{ fontWeight: 'bold', color: txn.type === 'influencer' ? 'var(--success)' : '#e68f00' }}>
                            {txn.type === 'influencer' ? `₹${txn.earnings}` : `${txn.earnings} Coins`}
                          </td>
                          <td>
                            <span 
                              className="badge" 
                              style={{ 
                                backgroundColor: txn.status === 'Approved' ? '#e8f5e9' : '#fffde7', 
                                color: txn.status === 'Approved' ? 'var(--success)' : '#f57f17' 
                              }}
                            >
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <FileText size={40} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>No referred purchases recorded yet. Start sharing links to generate conversions!</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WITHDRAW PAYOUTS (Only for Influencer) */}
          {activeTab === 'payouts' && currentUser.isInfluencer && (
            <div className="dashboard-panel-card">
              <h3 className="panel-header-title">Request Cash Withdrawal</h3>
              
              <div className="partner-payouts-grid">
                {/* Request panel */}
                <div className="card" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>Request Payout</h4>
                  <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label-txt">Available Withdrawable Balance:</label>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>₹{currentUser.walletCash.toFixed(2)}</div>
                    </div>

                    <div className="form-group">
                      <label className="form-label-txt">Withdrawal Amount (₹)*</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 500" 
                        value={withdrawAmount} 
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="form-input-field"
                        max={currentUser.walletCash}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label-txt">Withdrawal Destination*</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        {currentUser.payoutDetails.upi && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <input 
                              type="radio" 
                              name="withdraw-dest" 
                              checked={withdrawMethod === 'upi'}
                              onChange={() => setWithdrawMethod('upi')}
                            />
                            <span>UPI: {currentUser.payoutDetails.upi}</span>
                          </label>
                        )}
                        {currentUser.payoutDetails.bankAccount && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <input 
                              type="radio" 
                              name="withdraw-dest" 
                              checked={withdrawMethod === 'bank'}
                              onChange={() => setWithdrawMethod('bank')}
                            />
                            <span>Bank Account: ...{currentUser.payoutDetails.bankAccount.slice(-4)}</span>
                          </label>
                        )}
                        {!currentUser.payoutDetails.upi && !currentUser.payoutDetails.bankAccount && (
                          <span style={{ fontSize: '12px', color: 'var(--error)' }}>
                            No payment routing details found. Please switch simulator or enter UPI routing details on profile register.
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={currentUser.walletCash <= 0}
                    >
                      Withdraw Now
                    </button>
                  </form>
                </div>

                {/* History panel */}
                <div className="card" style={{ padding: '20px', display: 'flex', flex: 'column', gap: '10px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>Withdrawal Payouts History</h4>
                  {partnerStats.payouts.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="partner-table" style={{ width: '100%', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #eee' }}>
                            <th style={{ padding: '6px 0' }}>Date</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partnerStats.payouts.map((pay, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f9f9f9' }}>
                            <td style={{ padding: '8px 0' }}>{pay.date}</td>
                            <td style={{ fontWeight: 'bold' }}>₹{pay.amount.toFixed(2)}</td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{pay.method}</td>
                            <td><span className="badge badge-warning" style={{ fontSize: '10px' }}>{pay.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      No withdrawals requested yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default PartnerCenter;
