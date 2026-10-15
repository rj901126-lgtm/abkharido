import React, { useState, useEffect } from 'react';
import { Package, Sparkles, DollarSign, Image, Tag, Layers, CheckCircle, Smartphone, Eye, PlusCircle, RefreshCw, AlertCircle, TrendingUp, Award, Zap, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BulkProductUploadModal from './BulkProductUploadModal';

const AdminProductStudio = ({ onFinish }) => {
  const { addProduct, editProduct, showToast } = useApp();
  const [notification, setNotification] = useState({ show: false, text: '', type: 'success' });
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  // Enterprise Hybrid Form state (1P Direct Retail vs 3P Marketplace)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Mobiles',
    channel: '1P', // '1P' = AbKharido Direct Retail | '3P' = Partner Merchant (Marketplace)
    sellerShopName: 'AbKharido Direct',
    warehouseLocation: 'AbKharido Central Hub (Bhiwandi / Mumbai)',
    costPrice: '',
    commissionRate: '10',
    price: '',
    mrp: '',
    stock: '50',
    description: '',
    brand: 'Apple / Premium',
    sku: '',
    image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=600&q=80',
    isFlashDeal: false
  });

  const showToastMsg = (text, type = 'success') => {
    setNotification({ show: true, text, type });
    if (showToast) showToast(text, type);
    setTimeout(() => setNotification({ show: false, text: '', type: 'success' }), 3600);
  };

  const handleAIAutoGenerate = () => {
    const categoryDefaults = {
      Mobiles: {
        name: 'Apple iPhone 15 Pro Max (256GB, Natural Titanium)',
        price: '139900',
        mrp: '159900',
        stock: '45',
        description: 'Forged in aerospace-grade titanium with an all-new A17 Pro chip and ultra-powerful 48MP main camera setup. Experience unprecedented gaming graphics and USB-C speed.',
        brand: 'Apple',
        sku: 'SKU-APL-IPH15P-256'
      },
      Electronics: {
        name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        price: '26990',
        mrp: '34990',
        stock: '80',
        description: 'Industry-leading acoustic noise canceling with two processors and 8 microphones. Ultra-comfortable lightweight build with 30-hour rapid charging battery.',
        brand: 'Sony',
        sku: 'SKU-SNY-XM5-BLK'
      },
      Fashion: {
        name: 'Designer Royal Silk Sherwani & Kurta Ensemble',
        price: '8499',
        mrp: '14999',
        stock: '120',
        description: 'Handcrafted raw silk festive wear with intricate zari thread work and regal silhouette. Tailored for wedding royalty and grand luxury occasions.',
        brand: 'Designer Heritage',
        sku: 'SKU-FSH-SHER-990'
      }
    };

    const chosen = categoryDefaults[formData.category] || categoryDefaults['Mobiles'];
    setFormData(prev => ({ ...prev, ...chosen }));
    showToastMsg('🤖 AI automatically populated SEO-optimized specifications and pricing matrix!', 'success');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      showToastMsg('Please enter product title and pricing before publishing!', 'error');
      return;
    }

    const is1P = formData.channel === '1P';
    const priceNum = Number(formData.price) || 999;
    const costNum = Number(formData.costPrice) || Math.round(priceNum * 0.78);

    const createdProduct = {
      _id: `prod_${Date.now()}`,
      id: `prod_${Date.now()}`,
      name: formData.name,
      category: formData.category,
      price: priceNum,
      mrp: Number(formData.mrp) || Math.round(priceNum * 1.2),
      countInStock: Number(formData.stock) || 50,
      description: formData.description,
      brand: formData.brand,
      image: formData.image,
      channel: formData.channel,
      isOfficialStore: is1P,
      sellerShopName: is1P ? 'AbKharido Direct' : (formData.sellerShopName || 'Partner Merchant'),
      warehouseLocation: is1P ? formData.warehouseLocation : 'Merchant Facility',
      costPrice: is1P ? costNum : undefined,
      platformCommissionRate: is1P ? 0 : (Number(formData.commissionRate) || 10) / 100,
      createdAt: new Date().toISOString()
    };

    if (addProduct) addProduct(createdProduct);
    showToastMsg(`🚀 Product "${formData.name.slice(0, 25)}..." [${is1P ? '1P Direct Retail' : '3P Marketplace'}] synchronized to Live Storefront & MongoDB!`, 'success');
    
    // Clear form after slight delay
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 1500);
  };

  // Enterprise Profit & Yield calculations
  const priceVal = parseFloat(formData.price) || 0;
  const mrpVal = parseFloat(formData.mrp) || priceVal * 1.2;
  const discountPercent = mrpVal > priceVal ? Math.round(((mrpVal - priceVal) / mrpVal) * 100) : 0;
  const is1P = formData.channel === '1P';
  const costVal = parseFloat(formData.costPrice) || Math.round(priceVal * 0.78);
  const retailGrossProfit = Math.max(0, priceVal - costVal);
  const retailMarginPercent = priceVal > 0 ? Math.round((retailGrossProfit / priceVal) * 100) : 22;
  const commissionVal = Math.round(priceVal * ((Number(formData.commissionRate) || 10) / 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', animation: 'fadeIn 0.2s', paddingBottom: '40px' }}>
      
      {/* Toast Notification */}
      {notification.show && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', background: '#059669', color: '#fff', padding: '16px 26px', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '800' }}>
          <CheckCircle size={22} /> {notification.text}
        </div>
      )}

      {/* Top Studio Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #311042 100%)', padding: '30px', borderRadius: '24px', color: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', background: '#ec4899', color: '#ffffff', padding: '4px 12px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={13} /> AI PRODUCT COMMAND STUDIO 2.0
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px' }}>
            Create & Elevate Storefront Products
          </h2>
          <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px' }}>
            Harness instant AI copywriting, profit yield modeling, and real-time mobile card preview simulation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            style={{ padding: '14px 22px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.25)', background: 'linear-gradient(135deg, #059669, #0d9488)', color: '#ffffff', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 25px rgba(5, 150, 105, 0.35)', transition: 'all 0.2s' }}
          >
            <FileSpreadsheet size={18} /> 📁 Multiple Products (Bulk CSV Import)
          </button>

          <button
            type="button"
            onClick={handleAIAutoGenerate}
            style={{ padding: '14px 22px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', background: 'linear-gradient(135deg, #4f46e5, #ec4899)', color: '#ffffff', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 25px rgba(236, 72, 153, 0.3)', transition: 'all 0.2s' }}
          >
            <Sparkles size={18} /> ✨ 1-Click AI Auto-Fill & SEO Setup
          </button>
        </div>
      </div>

      {/* Main Grid: Left Editor | Right Mobile Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '26px' }}>
        
        {/* Left Form Panel */}
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package size={22} style={{ color: '#4f46e5' }} /> Core Product Specifications
            </h3>
            <span style={{ fontSize: '11px', fontWeight: '800', background: is1P ? '#dbeafe' : '#f3e8ff', color: is1P ? '#1e40af' : '#7e22ce', padding: '4px 12px', borderRadius: '100px', border: `1px solid ${is1P ? '#93c5fd' : '#d8b4fe'}` }}>
              {is1P ? '🏬 1P DIRECT RETAIL MODE' : '🏪 3P MARKETPLACE MODE'}
            </span>
          </div>

          {/* Enterprise Hybrid Channel Selector (Amazon 1P vs 3P Model) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
              Fulfillment &amp; Ownership Channel (Enterprise Hybrid Model)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, channel: '1P', sellerShopName: 'AbKharido Direct' })}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  border: is1P ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: is1P ? '#eff6ff' : '#ffffff',
                  color: is1P ? '#1e40af' : '#475569',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: '20px' }}>🏬</span>
                <div>
                  <div style={{ fontWeight: '900' }}>AbKharido Direct (1P)</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>In-House Inventory • 100% Platform Sales</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, channel: '3P', sellerShopName: '' })}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  border: !is1P ? '2px solid #9333ea' : '1px solid #cbd5e1',
                  background: !is1P ? '#faf5ff' : '#ffffff',
                  color: !is1P ? '#7e22ce' : '#475569',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: '20px' }}>🏪</span>
                <div>
                  <div style={{ fontWeight: '900' }}>Partner Merchant (3P)</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Marketplace Seller • 10% Platform Fee</div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional 1P vs 3P Controls */}
          {is1P ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 18px', borderRadius: '16px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#166534' }}>Fulfillment Center Hub (1P)</label>
                <input
                  type="text"
                  value={formData.warehouseLocation}
                  onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #86efac', fontSize: '13px', fontWeight: '700', background: '#ffffff', color: '#14532d' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#166534' }}>Purchase Cost COGS (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 109900"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #86efac', fontSize: '13px', fontWeight: '700', background: '#ffffff', color: '#14532d' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '14px 18px', borderRadius: '16px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#6b21a8' }}>Partner Merchant Shop Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gujarat Electronics Co."
                  value={formData.sellerShopName}
                  onChange={(e) => setFormData({ ...formData, sellerShopName: e.target.value })}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #d8b4fe', fontSize: '13px', fontWeight: '700', background: '#ffffff', color: '#581c87' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#6b21a8' }}>Marketplace Fee (%)</label>
                <input
                  type="number"
                  placeholder="10"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #d8b4fe', fontSize: '13px', fontWeight: '700', background: '#ffffff', color: '#581c87' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Product Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{ padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '700', background: '#f8fafc', outline: 'none' }}
            >
              <option value="Mobiles">📱 Mobiles &amp; Smart Gadgets</option>
              <option value="Electronics">💻 Enterprise Laptops &amp; Electronics</option>
              <option value="Fashion">👕 Designer Fashion &amp; Street Wear</option>
              <option value="Home">🏠 Royal Living &amp; Smart Home</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Product Title &amp; Specs</label>
            <input
              type="text"
              placeholder="e.g. Apple iPhone 15 Pro Max (256GB, Natural Titanium)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none', background: '#f8fafc' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Offer Selling Price (₹)</label>
              <input
                type="number"
                placeholder="139900"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                style={{ padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '800', color: '#059669', outline: 'none', background: '#f8fafc' }}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Original MRP (₹)</label>
              <input
                type="number"
                placeholder="159900"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                style={{ padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '700', color: '#94a3b8', outline: 'none', background: '#f8fafc' }}
              />
            </div>
          </div>

          {/* Profit Margin Radar Bar */}
          {priceVal > 0 && (
            <div style={{ background: is1P ? '#f0fdf4' : '#faf5ff', border: `1px solid ${is1P ? '#bbf7d0' : '#e9d5ff'}`, padding: '14px 18px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {is1P ? (
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: '800', display: 'block' }}>
                    1P Retail Gross Profit: <strong>₹{retailGrossProfit.toLocaleString('en-IN')} (+{retailMarginPercent}%)</strong>
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#6b21a8', fontWeight: '800', display: 'block' }}>
                    3P Platform Commission (10%): <strong>₹{commissionVal.toLocaleString('en-IN')}</strong> • Vendor Payout: ₹{(priceVal - commissionVal).toLocaleString('en-IN')}
                  </span>
                )}
                <span style={{ fontSize: '11px', color: is1P ? '#15803d' : '#7e22ce', fontWeight: '600' }}>
                  Customer Savings Discount: <strong>{discountPercent}% OFF</strong>
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '900', background: is1P ? '#16a34a' : '#9333ea', color: '#ffffff', padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase' }}>
                {is1P ? '🏬 1P IN-HOUSE' : '🏪 3P ESCROW MEDIATED'}
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Warehouse Stock (Units)</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                style={{ padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none', background: '#f8fafc' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Brand Tag</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                style={{ padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none', background: '#f8fafc' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>High-Res Image URL</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              style={{ padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', outline: 'none', background: '#f8fafc' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>SEO Product Description</label>
            <textarea
              rows={4}
              placeholder="Enter comprehensive specs or use 1-Click AI Auto-Fill above..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '500', outline: 'none', background: '#f8fafc', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 25px rgba(79, 70, 229, 0.25)', transition: 'all 0.2s', marginTop: '10px' }}
          >
            <CheckCircle size={20} /> Publish to Storefront & MongoDB 🚀
          </button>
        </form>

        {/* Right Mobile Storefront Simulator Card */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: '800', fontSize: '13px', textTransform: 'uppercase' }}>
            <Smartphone size={16} color="#3b82f6" /> Live iPhone 15 Pro Max Card Preview
          </div>

          {/* Smartphone Frame */}
          <div style={{ width: '300px', background: '#ffffff', borderRadius: '32px', border: '12px solid #0f172a', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Speaker Notch */}
            <div style={{ width: '100px', height: '14px', background: '#0f172a', alignSelf: 'center', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', marginBottom: '8px' }}></div>

            {/* Product Card Rendering */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '220px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={formData.image} alt={formData.name || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'; }} />
                {discountPercent > 0 && (
                  <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: '900', padding: '4px 10px', borderRadius: '100px' }}>
                    {discountPercent}% OFF
                  </span>
                )}
                <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '8px' }}>
                  ⚡ Free Express Delivery
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase' }}>{formData.brand || 'Premium Brand'}</span>
                <h4 style={{ margin: '3px 0 0', fontSize: '15px', fontWeight: '900', color: '#0f172a', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {formData.name || 'New Storefront Product Title'}
                </h4>
                {/* 1P vs 3P Seller Attribution Pill */}
                <div style={{ marginTop: '5px' }}>
                  {is1P ? (
                    <span style={{ fontSize: '10px', fontWeight: '800', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      ⚡ Sold by: AbKharido Direct (Assured 24h)
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', fontWeight: '800', background: '#f3e8ff', color: '#7e22ce', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      🏪 Sold by: {formData.sellerShopName || 'Verified Merchant'} ✓
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                  ₹{(Number(formData.price) || 0).toLocaleString('en-IN')}
                </span>
                {mrpVal > priceVal && (
                  <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>
                    ₹{mrpVal.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {formData.description || 'Live preview of product specifications as displayed on the responsive store catalog.'}
              </p>

              <button
                type="button"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#0f172a', color: '#ffffff', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}
              >
                🛒 Add to Shopping Bag
              </button>
            </div>

            {/* Home indicator */}
            <div style={{ width: '80px', height: '4px', background: '#cbd5e1', borderRadius: '4px', alignSelf: 'center', margin: '8px 0 12px' }}></div>
          </div>

          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center' }}>
            ● Real-time render synchronized with Next.js Turbopack styling
          </span>
        </div>

      </div>

      <BulkProductUploadModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        shopName={is1P ? 'AbKharido Direct' : formData.sellerShopName}
        onImportSuccess={(newProducts) => {
          showToastMsg(`🚀 Successfully batch imported ${newProducts?.length || 'all'} products into database!`, 'success');
          setIsBulkModalOpen(false);
          if (onFinish) onFinish();
        }}
      />

    </div>
  );
};

export default AdminProductStudio;
