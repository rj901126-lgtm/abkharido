import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Share2, 
  Coins, 
  MousePointer, 
  ShoppingBag, 
  Copy, 
  Check, 
  TrendingUp,
  FileText
} from 'lucide-react';
import '../assets/styles/partner.css';

const PartnerCenter = () => {
  const { currentUser, partnerStats, requestPayout, showToast, products } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // overview, generator, history, payouts
  const [copiedLink, setCopiedLink] = useState('');
  
  // Link Generator States
  const [selectedProdId, setSelectedProdId] = useState(products && products.length > 0 ? products[0].id : '');

  // Withdrawal States
  const [withdrawCoins, setWithdrawCoins] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');
  const [bankAcc, setBankAcc] = useState('');
  const [upiId, setUpiId] = useState('');

  const withdrawableCoins = currentUser?.withdrawableCoins !== undefined ? currentUser.withdrawableCoins : currentUser?.walletCoins || 0;
  const lockedCoins = currentUser?.lockedCoins || 0;

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

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amountNum = parseInt(withdrawCoins, 10);
    if (isNaN(amountNum) || amountNum < 1000) {
      showToast('Minimum withdrawal is 1000 Coins.', 'error');
      return;
    }
    if (amountNum > withdrawableCoins) {
      showToast('Insufficient withdrawable coins.', 'error');
      return;
    }
    if (withdrawMethod === 'upi' && !upiId) {
      showToast('Please enter your UPI ID.', 'error');
      return;
    }
    if (withdrawMethod === 'bank' && !bankAcc) {
      showToast('Please enter your Bank Account.', 'error');
      return;
    }
    
    const success = requestPayout(
      amountNum, 
      withdrawMethod === 'upi' ? `UPI: ${upiId}` : `Bank: ${bankAcc}`
    );

    if (success) {
      setWithdrawCoins('');
      setUpiId('');
      setBankAcc('');
    }
  };

  const getStorewideLink = () => {
    const origin = window.location.origin;
    return `${origin}/?ref=${currentUser.referralCode || currentUser.username}`;
  };

  const getSelectedProductLink = () => {
    const origin = window.location.origin;
    return `${origin}/?prod=${selectedProdId}&ref=${currentUser.referralCode || currentUser.username}`;
  };

  return (
    <div className="container partner-container animate-fade-in">
      
      {/* 1. Profile Header bar */}
      <div className="partner-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>{currentUser.fullName}'s Partner Dashboard</h1>
            <span className="badge badge-info" style={{ fontSize: '11px' }}>
              Store Member
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Refer friends to earn AbKharido Coins. Use coins to purchase products or withdraw to bank (1 Coin = 1 Rupee, Min. 1000 Coins).
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

      {/* Main Dashboard Control Panel */}
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
        <button 
          className={`dashboard-tab-btn ${activeTab === 'payouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          Withdraw Payouts
        </button>
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
              <div className="stat-icon-wrapper" style={{ background: '#fef3c7' }}>
                <Coins size={24} color="#d97706" />
              </div>
              <div className="stat-data">
                <span className="stat-val">
                  {currentUser.walletCoins}
                </span>
                <span className="stat-lbl">Total Coins</span>
                {lockedCoins > 0 && (
                  <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '2px' }}>
                    ({lockedCoins} Locked)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="partner-info-grid">
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Share2 size={16} color="var(--primary-color)" /> How Referral Attribution Works</h3>
              <ol style={{ fontSize: '13px', color: '#444', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.4' }}>
                <li>Copy any store or product tracking link containing your partner parameters.</li>
                <li>Share them on your social profiles, review blogs, or chat groups.</li>
                <li>When a customer clicks your link, a secure referral session is locked in their browser.</li>
                <li>If they checkout within that session, our platform awards you credit in Coins.</li>
                <li>Use Coins for discounts during checkout, or withdraw to Bank/UPI once you cross 1,000 Coins.</li>
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
                  <span style={{ color: '#e68f00' }}>Coin rate: {(products.find(p => p.id === selectedProdId)?.userCommissionRate || 0.02) * 100}%</span>
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
                      <td style={{ fontWeight: 'bold', color: '#e68f00' }}>
                        {txn.earnings} Coins
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

      {/* TAB 4: WITHDRAW PAYOUTS */}
      {activeTab === 'payouts' && (
        <div className="dashboard-panel-card">
          <h3 className="panel-header-title">Request Cash Withdrawal</h3>
          
          <div className="partner-payouts-grid">
            {/* Request panel */}
            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>Request Payout (1 Coin = 1 ₹)</h4>
                <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label-txt">Available Withdrawable Balance:</label>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{withdrawableCoins} Coins</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Total Balance: {currentUser.walletCoins} ({lockedCoins} Locked)</div>
                    {withdrawableCoins < 1000 && (
                      <div style={{ fontSize: '12px', color: 'var(--error)', marginTop: '6px' }}>You need at least 1,000 Withdrawable Coins to request a payout. New coins are locked for 8 days after delivery.</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label-txt">Withdrawal Amount (Coins)*</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 1500" 
                      value={withdrawCoins} 
                      onChange={(e) => setWithdrawCoins(e.target.value)}
                      className="form-input-field"
                      max={withdrawableCoins}
                      min="1000"
                      disabled={withdrawableCoins < 1000}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-txt">Withdrawal Method*</label>
                    <select 
                      value={withdrawMethod} 
                      onChange={(e) => setWithdrawMethod(e.target.value)}
                      className="form-input-field"
                      disabled={withdrawableCoins < 1000}
                    >
                      <option value="upi">UPI Transfer</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>

                  {withdrawMethod === 'upi' ? (
                    <div className="form-group">
                      <label className="form-label-txt">UPI ID*</label>
                      <input 
                        type="text" 
                        placeholder="e.g. yourname@upi" 
                        value={upiId} 
                        onChange={(e) => setUpiId(e.target.value)}
                        className="form-input-field"
                        disabled={withdrawableCoins < 1000}
                        required
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label-txt">Bank Account / IFSC*</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 123456789 / IFSC" 
                        value={bankAcc} 
                        onChange={(e) => setBankAcc(e.target.value)}
                        className="form-input-field"
                        disabled={withdrawableCoins < 1000}
                        required
                      />
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={withdrawableCoins < 1000}
                  >
                    Withdraw Now
                  </button>
                </form>
            </div>

            {/* History panel */}
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>Withdrawal Payouts History</h4>
              {partnerStats.payouts.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="partner-table" style={{ width: '100%', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '6px 0' }}>Date</th>
                        <th>Amount (₹)</th>
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
    </div>
  );
};

export default PartnerCenter;
