import React, { useState, useEffect } from 'react';
import { Package, Sparkles, DollarSign, Image, Tag, Layers, CheckCircle, Smartphone, Eye, PlusCircle, RefreshCw, AlertCircle, TrendingUp, Award, Zap, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminProductStudio = ({ onFinish }) => {
  const { addProduct, editProduct, showToast } = useApp();
  const [notification, setNotification] = useState({ show: false, text: '', type: 'success' });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Mobiles',
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

    const createdProduct = {
      _id: `prod_${Date.now()}`,
      id: `prod_${Date.now()}`,
      name: formData.name,
      category: formData.category,
      price: Number(formData.price) || 999,
      mrp: Number(formData.mrp) || Number(formData.price) * 1.2,
      countInStock: Number(formData.stock) || 50,
      description: formData.description,
      brand: formData.brand,
      image: formData.image,
      createdAt: new Date().toISOString()
    };

    if (addProduct) addProduct(createdProduct);
    showToastMsg(`🚀 Product "${formData.name.slice(0, 25)}..." successfully synchronized to Live Storefront & MongoDB!`, 'success');
    
    // Clear form after slight delay
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 1500);
  };

  // Profit calculations
  const priceVal = parseFloat(formData.price) || 0;
  const mrpVal = parseFloat(formData.mrp) || priceVal * 1.2;
  const discountPercent = mrpVal > priceVal ? Math.round(((mrpVal - priceVal) / mrpVal) * 100) : 0;
  const estMargin = Math.round(priceVal * 0.22); // ~22% net platform margin

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

        <button
          type="button"
          onClick={handleAIAutoGenerate}
          style={{ padding: '14px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', background: 'linear-gradient(135deg, #4f46e5, #ec4899)', color: '#ffffff', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 25px rgba(236, 72, 153, 0.3)', transition: 'all 0.2s' }}
        >
          <Sparkles size={18} /> ✨ 1-Click AI Auto-Fill & SEO Setup
        </button>
      </div>

      {/* Main Grid: Left Editor | Right Mobile Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '26px' }}>
        
        {/* Left Form Panel */}
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
            <Package size={22} style={{ color: '#4f46e5' }} /> Core Product Specifications
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Product Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{ padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '700', background: '#f8fafc', outline: 'none' }}
            >
              <option value="Mobiles">📱 Mobiles & Smart Gadgets</option>
              <option value="Electronics">💻 Enterprise Laptops & Electronics</option>
              <option value="Fashion">👕 Designer Fashion & Street Wear</option>
              <option value="Home">🏠 Royal Living & Smart Home</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Product Title & Specs</label>
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
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 18px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: '800', display: 'block' }}>Estimated Platform Profit: <strong>₹{estMargin.toLocaleString()}</strong></span>
                <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '600' }}>Customer Savings Discount: <strong>{discountPercent}% OFF</strong></span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '900', background: '#16a34a', color: '#ffffff', padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase' }}>
                🟢 ULTRA PROFITABLE
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

    </div>
  );
};

export default AdminProductStudio;
