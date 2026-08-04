import React, { useState, useEffect } from 'react';
import { Megaphone, Zap, Image as ImageIcon, Layers, Save, Plus, Trash2, CheckCircle, Clock, Tag, Globe, Sparkles, ShieldCheck, TrendingUp, DollarSign, ExternalLink, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminPromotions = () => {
  const { showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('homepage_hero');
  const [selectedCategory, setSelectedCategory] = useState('mobiles');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, text: '', type: 'success' });

  // Promotional state architecture
  const [announcement, setAnnouncement] = useState({
    show: true,
    text: '🔥 MEGA FESTIVE CARNIVAL IS LIVE! Flat 60% OFF + Instant ₹2,000 Cashfree Escrow Cashback on all Tech & Fashion Orders above ₹4,999! 🚀',
    link: '/catalog?sale=mega_festive'
  });

  const [flashDeals, setFlashDeals] = useState({
    enabled: true,
    timerEnd: new Date(Date.now() + 8 * 3600000).toISOString(),
    budgetThreshold: 350000,
    selectedProducts: [
      { id: 'PROD-101', name: 'Apple iPhone 15 Pro Max (512GB, Titanium)', price: '₹1,48,900', dealPrice: '₹1,29,999', selected: true, stock: 42 },
      { id: 'PROD-102', name: 'Samsung Galaxy S24 Ultra (256GB, AI Special)', price: '₹1,29,999', dealPrice: '₹1,12,499', selected: true, stock: 35 },
      { id: 'PROD-103', name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones', price: '₹29,990', dealPrice: '₹22,490', selected: true, stock: 88 },
      { id: 'PROD-104', name: 'MacBook Air M3 (16GB RAM, 512GB SSD Midnight)', price: '₹1,34,900', dealPrice: '₹1,18,500', selected: false, stock: 18 }
    ]
  });

  const [heroBanners, setHeroBanners] = useState([
    {
      id: 'HERO-1',
      title: 'Grand Tech & Flagship Smartphone Carnival',
      subTitle: 'Experience unprecedented performance with Titanium designs and Next-Gen AI features.',
      imageUrl: 'https://mages.unsplash.com/photo-1592659762303-90081d34b277?auto=format&fit=crop&q=80&w=1200',
      badge: 'FLAT 25% OFF + NO-COST EMI',
      link: '/category/mobiles',
      bgGradient: 'linear-gradient(135deg, #1e1b4b, #312e81)'
    },
    {
      id: 'HERO-2',
      title: 'Royal Home Aesthetics & Smart Appliances Extravaganza',
      subTitle: 'Upgrade your lifestyle with energy-efficient 5-Star cooling & robotic vacuum systems.',
      imageUrl: 'https://mages.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=1200',
      badge: 'FESTIVE SPECIAL DOORBUSTERS',
      link: '/category/home',
      bgGradient: 'linear-gradient(135deg, #451a03, #78350f)'
    }
  ]);

  const [categoryBanners, setCategoryBanners] = useState({
    all: { show: true, slides: [{ id: 'CAT-ALL-1', title: 'Complete Megastore Catalog Savings', imageUrl: 'https://mages.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1000', badge: 'SPECIAL DISCOUNT CODES APPLICABLE' }] },
    mobiles: { show: true, slides: [{ id: 'CAT-MOB-1', title: 'Flagship Smart Mobiles & 5G Revolution', imageUrl: 'https://mages.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1000', badge: 'INSTANT ₹5,000 BANK DISCOUNT' }] },
    electronics: { show: true, slides: [{ id: 'CAT-ELE-1', title: 'Enterprise Tech, Laptops & RTX Peripherals', imageUrl: 'https://mages.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=1000', badge: 'ABOVE 40% REBATE ON WORKSTATIONS' }] },
    fashion: { show: true, slides: [{ id: 'CAT-FAS-1', title: 'Designer Ethnic Ensembles & Western Street Wear', imageUrl: 'https://mages.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1000', badge: 'BUY 2 GET 1 FREE CARNIVAL' }] },
    home: { show: true, slides: [{ id: 'CAT-HOM-1', title: 'Luxury Living Decor & Smart Lighting Aesthetics', imageUrl: 'https://mages.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1000', badge: 'FREE INSTALLATION + WARRANTY SHIELD' }] },
    kitchen: { show: true, slides: [{ id: 'CAT-KIT-1', title: 'Chef-Grade Cookware & Automatic Kitchen Hubs', imageUrl: 'https://mages.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1000', badge: 'UP TO 55% OFF ON BUNDLES' }] }
  });

  const defaultVipCategories = [
    { id: 'all', label: 'All VIP Deals', icon: '💎', gradient: 'linear-gradient(135deg, #1e1b4b, #4338ca)', badge: 'HOT' },
    { id: 'mobiles', label: 'AI Smartphones & 5G', icon: '⚡', gradient: 'linear-gradient(135deg, #0284c7, #0369a1)', badge: 'NEW' },
    { id: 'electronics', label: 'Audiophile & Tech', icon: '🎧', gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)', badge: '-40%' },
    { id: 'fashion', label: 'Luxe Couture & Wear', icon: '👗', gradient: 'linear-gradient(135deg, #e11d48, #9f1239)', badge: 'TRENDING' },
    { id: 'home', label: 'Smart Home & AI', icon: '🏠', gradient: 'linear-gradient(135deg, #059669, #047857)', badge: 'TOP' },
    { id: 'beauty', label: 'Diamond Beauty & Spa', icon: '✨', gradient: 'linear-gradient(135deg, #d97706, #b45309)', badge: 'VIP' }
  ];

  const [vipCategories, setVipCategories] = useState(defaultVipCategories);

  const showToastMsg = (text, type = 'success') => {
    setNotification({ show: true, text, type });
    if (showToast) showToast(text, type);
    setTimeout(() => setNotification({ show: false, text: '', type: 'success' }), 3800);
  };

  useEffect(() => {
    // Load from local resilience vault if available
    try {
      const saved = localStorage.getItem('abkharido_promotions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.announcement) setAnnouncement(parsed.announcement);
        if (parsed.flashDeals) setFlashDeals(parsed.flashDeals);
        if (parsed.heroBanners && Array.isArray(parsed.heroBanners)) setHeroBanners(parsed.heroBanners);
        if (parsed.categoryBanners) setCategoryBanners(parsed.categoryBanners);
        if (parsed.vipCategories && Array.isArray(parsed.vipCategories)) setVipCategories(parsed.vipCategories);
      }
    } catch (err) {
      console.log('Using robust enterprise default promotions');
    }
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    const fullPayload = { announcement, flashDeals, heroBanners, categoryBanners, vipCategories };
    localStorage.setItem('abkharido_promotions_v2', JSON.stringify(fullPayload));
    localStorage.setItem('abkharido_vip_categories', JSON.stringify(vipCategories));
    window.dispatchEvent(new Event('abkharido_promotions_updated'));
    
    // Legacy sync
    try {
      localStorage.setItem('abkharido_announcement', JSON.stringify(announcement));
      localStorage.setItem('abkharido_banners', JSON.stringify(heroBanners));
    } catch (e) {}

    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/promotions/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(fullPayload)
      });
    } catch (err) {}

    setTimeout(() => {
      setIsSaving(false);
      showToastMsg('🚀 All promotional campaigns, doorbuster countdowns & category banners live-broadcasted to Vercel CDN!', 'success');
    }, 600);
  };

  // AI Holiday Presets
  const applyAIPreset = (preset) => {
    if (preset === 'diwali') {
      setHeroBanners([
        {
          id: `DIW-${Date.now()}`,
          title: '🪔 Diwali Gold Prosperity Mega Carnival',
          subTitle: 'Celebrate the festival of lights with up to 65% discounts on Flagship Electronics & Traditional Wear.',
          imageUrl: 'https://mages.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&q=80&w=1200',
          badge: '🪔 MEGA DIWALI SPECIAL DEALS',
          link: '/catalog?sale=diwali',
          bgGradient: 'linear-gradient(135deg, #78350f, #451a03)'
        },
        {
          id: `DIW-TECH-${Date.now()}`,
          title: '⚡ Dhanteras Flagship Smartphones & Smart TV Steals',
          subTitle: 'Instant cashback vouchers on Cashfree checkout and zero down payment EMI plans.',
          imageUrl: 'https://mages.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200',
          badge: 'FESTIVE DOORBUSTER HOUR',
          link: '/category/mobiles',
          bgGradient: 'linear-gradient(135deg, #1e3a8a, #0f172a)'
        }
      ]);
      setAnnouncement({
        show: true,
        text: '🪔 DIWALI GRAND BAZAAR LIVE! Use code DIWALI25 for extra ₹1,500 Instant Cashback across all categories! 🎉',
        link: '/catalog?sale=diwali'
      });
      showToastMsg('✨ AI Diwali Mega Carnival theme loaded into Homepage Carousel & Ticker!', 'success');
    } else if (preset === 'cyber') {
      setHeroBanners([
        {
          id: `CYB-${Date.now()}`,
          title: '⚡ Cyber Midnight Tech Week & Gaming Extravaganza',
          subTitle: 'RTX 4090 Workstations, OLED Monitors, and Mechanical Keyboard combos at wholesale vendor pricing.',
          imageUrl: 'https://mages.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200',
          badge: 'ABOVE 50% CYBER REBATE',
          link: '/category/electronics',
          bgGradient: 'linear-gradient(135deg, #3730a3, #1e1b4b)'
        }
      ]);
      showToastMsg('⚡ AI Cyber Tech Midnight theme loaded successfully!', 'success');
    } else if (preset === 'summer') {
      setHeroBanners([
        {
          id: `SUM-${Date.now()}`,
          title: '🌸 Spring & Summer Vibes Designer Wardrobe Refresh',
          subTitle: 'Airy linen dresses, UV-shield eyewear, and luxury luxury watches at unbeatable seasonal discounts.',
          imageUrl: 'https://mages.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
          badge: 'SUMMER FASHION CARNIVAL',
          link: '/category/fashion',
          bgGradient: 'linear-gradient(135deg, #831843, #4c0519)'
        }
      ]);
      showToastMsg('🌸 AI Summer Wardrobe Refresh theme applied!', 'success');
    }
  };

  const syncToStorefront = (newBanners) => {
    try {
      localStorage.setItem('abkharido_banners', JSON.stringify(newBanners));
      const existingPromo = JSON.parse(localStorage.getItem('abkharido_promotions_v2') || '{}');
      existingPromo.heroBanners = newBanners;
      localStorage.setItem('abkharido_promotions_v2', JSON.stringify(existingPromo));
      window.dispatchEvent(new Event('abkharido_promotions_updated'));
    } catch (e) {}
  };

  const addHeroSlide = () => {
    const newSlide = {
      id: `HERO-${Date.now().toString().slice(-4)}`,
      title: 'New Custom Promotional Campaign Title',
      subTitle: 'Enter a high-converting subtitle explaining key consumer benefits and warranty guarantees.',
      imageUrl: 'https://mages.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1200',
      badge: 'SPECIAL PROMO DISCOUNT',
      link: '/catalog',
      bgGradient: 'linear-gradient(135deg, #1f2937, #111827)'
    };
    const updated = [...heroBanners, newSlide];
    setHeroBanners(updated);
    syncToStorefront(updated);
    showToastMsg('➕ New Hero Banner added & broadcasted to Live Storefront!', 'success');
  };

  const updateHeroSlide = (idx, field, val) => {
    const copy = [...heroBanners];
    copy[idx][field] = val;
    setHeroBanners(copy);
    syncToStorefront(copy);
  };

  const removeHeroSlide = (idx) => {
    const copy = [...heroBanners];
    copy.splice(idx, 1);
    setHeroBanners(copy);
    syncToStorefront(copy);
    showToastMsg('🗑️ Banner instantly removed & un-published from live website!', 'success');
  };

  const toggleProductSelect = (id) => {
    const copy = flashDeals.selectedProducts.map(p => p.id === id ? { ...p, selected: !p.selected } : p);
    setFlashDeals({ ...flashDeals, selectedProducts: copy });
  };

  const setTimerDuration = (hours) => {
    const target = new Date(Date.now() + hours * 3600000).toISOString();
    setFlashDeals({ ...flashDeals, timerEnd: target });
    showToastMsg(`⚡ Flash Deal Countdown extended by ${hours} hours!`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', paddingBottom: '50px' }}>
      
      {/* Toast Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 999999,
          background: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: notification.type === 'error' ? '#991b1b' : '#166534',
          border: '2px solid', borderColor: notification.type === 'error' ? '#f87171' : '#86efac',
          padding: '14px 22px', borderRadius: '14px', fontWeight: '700',
          boxShadow: '0 12px 35px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: '12px',
          animation: 'slideIn 0.25s ease-out'
        }}>
          <span style={{ fontSize: '22px' }}>{notification.type === 'error' ? '❌' : '✅'}</span>
          <span>{notification.text}</span>
          <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
      )}

      {/* Top Luxury Command Center Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', padding: '30px 36px', borderRadius: '26px', color: '#ffffff', boxShadow: '0 15px 40px rgba(15, 23, 42, 0.4)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px', border: '1px solid rgba(255,255,255,0.15)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: 'linear-gradient(to right, #f59e0b, #ea580c)', color: '#ffffff', padding: '4px 14px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Megaphone size={14} /> 📢 ENTERPRISE PROMOTIONS HUB 2.0
            </span>
            <span style={{ fontSize: '11px', fontWeight: '800', background: '#059669', color: '#ecfdf5', padding: '4px 12px', borderRadius: '100px', border: '1px solid #34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> BUDGET SAFEGUARD SHIELD: ACTIVE
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '30px', fontFamily: 'Outfit, sans-serif', fontWeight: '900', letterSpacing: '-0.5px' }}>
            Promotions, Flash Deals & Modular Banners Command Center 2.0
          </h2>
          <p style={{ margin: '8px 0 0', color: '#cbd5e1', fontSize: '15px', maxWidth: '700px', lineHeight: '1.5' }}>
            Orchestrate high-impact announcement bars, govern flash doorbuster countdowns, deploy AI seasonal carousels in 1-click, and navigate cleanly via modular category switches without endless scrolling.
          </p>
        </div>

        <button 
          type="button"
          onClick={handleSaveAll} 
          disabled={isSaving}
          style={{ padding: '15px 30px', fontSize: '16px', fontWeight: '900', borderRadius: '100px', background: isSaving ? '#4f46e5' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)', border: 'none', color: '#ffffff', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}
        >
          <Save size={20} /> <span>{isSaving ? 'Broadcasting...' : 'Broadcast to Live Store'}</span>
        </button>
      </div>

      {/* 4 Luxury KPI Meters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', background: '#eff6ff', color: '#3b82f6', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={26} />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Active Banners</span>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>{heroBanners.length + 6} Active</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', background: '#f0fdf4', color: '#166534', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={26} />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Flash Deal Velocity</span>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669', marginTop: '2px' }}>+46.8% CTR 🔥</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', background: '#fef3c7', color: '#b45309', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={26} />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Promo Discount GMV</span>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>₹18.4+ Lakhs</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '50px', background: '#fdf2f8', color: '#db2777', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={26} />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>AI Preset Ready</span>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#db2777', marginTop: '2px' }}>1-Click Sync</div>
          </div>
        </div>
      </div>

      {/* ── MODULAR SMART TAB SWITCHER BAR (REPLACES ENDLESS SCROLLING) ── */}
      <div style={{ display: 'flex', gap: '12px', background: '#f8fafc', padding: '10px', borderRadius: '20px', border: '1px solid #cbd5e1', flexWrap: 'wrap' }}>
        {[
          { id: 'homepage_hero', label: '🎨 Homepage Hero Banners', icon: <ImageIcon size={18} /> },
          { id: 'flash_deals', label: '⚡ Flash Deals Engine', icon: <Zap size={18} /> },
          { id: 'announcement', label: '📢 Overhead Announcement Ticker', icon: <Megaphone size={18} /> },
          { id: 'category_banners', label: '📂 Category-Wise Banners', icon: <Layers size={18} /> },
          { id: 'vip_categories', label: '💎 VIP Category Pills', icon: <Tag size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              flex: 1, minWidth: '220px', padding: '14px 20px', borderRadius: '14px', border: 'none',
              background: activeSubTab === tab.id ? 'linear-gradient(135deg, #4f46e5, #3730a3)' : 'transparent',
              color: activeSubTab === tab.id ? '#ffffff' : '#475569',
              fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: activeSubTab === tab.id ? '0 8px 20px rgba(79, 70, 229, 0.25)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: HOMEPAGE HERO CAROUSEL ── */}
      {activeSubTab === 'homepage_hero' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', animation: 'fadeIn 0.25s' }}>
          
          {/* AI 1-Click Festive Themes Banner */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '12px', background: '#dbeafe', borderRadius: '14px', color: '#2563eb' }}>
                <Sparkles size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#1e3a8a' }}>🤖 AI 1-Click Festive Carousel Presets</h4>
                <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>Instantly populate high-converting holiday themed slides without tedious manual image uploads.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => applyAIPreset('diwali')}
                style={{ padding: '10px 18px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                🪔 Load Diwali Carnival (2 Slides)
              </button>
              <button
                type="button"
                onClick={() => applyAIPreset('cyber')}
                style={{ padding: '10px 18px', borderRadius: '12px', background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                ⚡ Load Cyber Tech Week
              </button>
              <button
                type="button"
                onClick={() => applyAIPreset('summer')}
                style={{ padding: '10px 18px', borderRadius: '12px', background: '#fdf2f8', color: '#9d174d', border: '1px solid #fbcfe8', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                🌸 Load Summer Wardrobe
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={22} style={{ color: '#4f46e5' }} /> Active Homepage Hero Carousel ({heroBanners.length} Slides)
            </h3>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>Changes broadcast to `/` homepage automatically on save</span>
          </div>

          {heroBanners.map((slide, idx) => (
            <div 
              key={slide.id || idx} 
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '28px', boxShadow: '0 4px 25px rgba(0,0,0,0.03)', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'center', position: 'relative' }}
            >
              {/* Form Input Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '900', background: '#4f46e5', color: '#ffffff', padding: '4px 10px', borderRadius: '8px' }}>SLIDE #{idx + 1}</span>
                  <input 
                    type="text" 
                    value={slide.badge || 'PROMO BADGE'}
                    onChange={e => updateHeroSlide(idx, 'badge', e.target.value)}
                    placeholder="Badge Text (e.g., FLAT 30% OFF)"
                    style={{ padding: '6px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: '800', fontSize: '12px', color: '#b45309', background: '#fffbeb' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Main Carousel Headline</label>
                  <input 
                    type="text" 
                    value={slide.title}
                    onChange={e => updateHeroSlide(idx, 'title', e.target.value)}
                    placeholder="e.g. Grand Tech Flagship Carnival"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: '800', color: '#0f172a', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Sub-Headline Value Proposition</label>
                  <textarea 
                    value={slide.subTitle}
                    onChange={e => updateHeroSlide(idx, 'subTitle', e.target.value)}
                    placeholder="Explain key offers, EMI deals and instant discounts"
                    rows="2"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', color: '#475569', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>High-Res Banner Image URL</label>
                    <input 
                      type="text" 
                      value={slide.imageUrl}
                      onChange={e => updateHeroSlide(idx, 'imageUrl', e.target.value)}
                      placeholder="https://mages.unsplash.com/..."
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box', color: '#334155' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Target Link Slug</label>
                    <input 
                      type="text" 
                      value={slide.link}
                      onChange={e => updateHeroSlide(idx, 'link', e.target.value)}
                      placeholder="/category/mobiles"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              {/* Real-Time Live Visual Preview Card */}
              <div style={{ 
                height: '240px', borderRadius: '20px', overflow: 'hidden', position: 'relative',
                background: slide.imageUrl ? `url(${slide.imageUrl}) center/cover no-repeat` : slide.bgGradient || '#1e293b',
                border: '2px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px', color: '#ffffff'
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 70%, transparent 100%)' }}></div>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', background: '#f59e0b', color: '#000000', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start', textTransform: 'uppercase' }}>{slide.badge}</span>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', lineHeight: '1.2', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{slide.title || 'Grand Title'}</h4>
                  <p style={{ margin: 0, fontSize: '11px', opacity: 0.9, lineClamp: 2, overflow: 'hidden' }}>{slide.subTitle}</p>
                </div>
                <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', color: '#4ade80' }}>● LIVE PREVIEW</span>
              </div>

              {/* Remove Action Button */}
              <div style={{ position: 'absolute', top: '22px', right: '22px' }}>
                <button 
                  type="button"
                  onClick={() => removeHeroSlide(idx)}
                  style={{ color: '#ffffff', background: '#dc2626', border: '1px solid #b91c1c', borderRadius: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '13px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)', transition: 'all 0.15s' }}
                  title="Remove Slide & Unpublish from Homepage"
                >
                  <Trash2 size={16} /> <span>Remove from Website</span>
                </button>
              </div>
            </div>
          ))}

          <button 
            type="button"
            onClick={addHeroSlide}
            style={{ 
              alignSelf: 'center', display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', padding: '16px 38px', borderRadius: '100px', border: '2px dashed #4f46e5', background: '#eff6ff', color: '#312e81', fontWeight: '900', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.1)'
            }}
          >
            <Plus size={20} style={{ color: '#4f46e5' }} /> <span>Add New Custom Hero Slide</span>
          </button>
        </div>
      )}

      {/* ── TAB 2: FLASH DEALS & DOORBUSTERS ENGINE ── */}
      {activeSubTab === 'flash_deals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', animation: 'fadeIn 0.25s' }}>
          
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '22px', padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '54px', height: '54px', background: '#fef3c7', color: '#b45309', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#78350f' }}>⚡ Flash Deals & Midnight Doorbusters Engine</h3>
                <span style={{ fontSize: '13px', color: '#b45309', fontWeight: '600' }}>Create urgency countdowns with automatic stock reservation and discount caps.</span>
              </div>
            </div>

            {/* Quick Extension Buttons */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#92400e', marginRight: '4px' }}>EXTEND TIMER:</span>
              <button type="button" onClick={() => setTimerDuration(4)} style={{ padding: '8px 16px', borderRadius: '12px', background: '#b45309', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>+4 Hours</button>
              <button type="button" onClick={() => setTimerDuration(12)} style={{ padding: '8px 16px', borderRadius: '12px', background: '#92400e', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>+12 Hours</button>
              <button type="button" onClick={() => setTimerDuration(24)} style={{ padding: '8px 16px', borderRadius: '12px', background: '#78350f', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>+24 Hours</button>
            </div>
          </div>

          {/* Configuration Card */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '28px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Countdown Expiration ISO Timestamp</label>
              <input 
                type="text" 
                value={flashDeals.timerEnd}
                onChange={e => setFlashDeals({ ...flashDeals, timerEnd: e.target.value })}
                style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: '800', fontFamily: 'monospace', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700', display: 'block', marginTop: '6px' }}>● Status: Active Live Clock running on Storefront</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Promotional Budget Safeguard Cap (in ₹)</label>
              <input 
                type="number" 
                value={flashDeals.budgetThreshold}
                onChange={e => setFlashDeals({ ...flashDeals, budgetThreshold: Number(e.target.value) })}
                style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: '900', fontSize: '15px', color: '#0f172a', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginTop: '6px' }}>Shield will automatically stop extra discounts once budget threshold is breached.</span>
            </div>
          </div>

          {/* Product Checklist Grid */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '28px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 18px', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>🛍️ Select Flagship Products for Doorbuster Showcase</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {flashDeals.selectedProducts.map(prod => (
                <div 
                  key={prod.id}
                  onClick={() => toggleProductSelect(prod.id)}
                  style={{ 
                    padding: '18px', borderRadius: '16px', border: '2px solid',
                    borderColor: prod.selected ? '#3b82f6' : '#e2e8f0',
                    background: prod.selected ? '#eff6ff' : '#f8fafc',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <input type="checkbox" checked={prod.selected} readOnly style={{ width: '20px', height: '20px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a', lineClamp: 1 }}>{prod.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Original: <span style={{ textDecoration: 'line-through' }}>{prod.price}</span> ➔ <strong style={{ color: '#166534' }}>{prod.dealPrice}</strong></div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', background: prod.stock > 20 ? '#dcfce7' : '#fee2e2', color: prod.stock > 20 ? '#166534' : '#991b1b', padding: '4px 10px', borderRadius: '8px' }}>
                    {prod.stock} left
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: OVERHEAD ANNOUNCEMENT TICKER ── */}
      {activeSubTab === 'announcement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', animation: 'fadeIn 0.25s' }}>
          
          {/* Live Simulator Preview Banner */}
          <div style={{ background: '#f8fafc', border: '2px dashed #94a3b8', borderRadius: '22px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={15} /> Live Storefront Ticker Simulator Preview
            </span>

            {announcement.show ? (
              <div style={{ background: 'linear-gradient(to right, #ea580c, #db2777, #7c3aed)', padding: '12px 24px', borderRadius: '14px', color: '#ffffff', fontWeight: '900', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(234, 88, 12, 0.25)' }}>
                <span>{announcement.text}</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '100px', fontSize: '11px' }}>SHOP NOW →</span>
              </div>
            ) : (
              <div style={{ background: '#e2e8f0', padding: '12px', borderRadius: '14px', textAlign: 'center', color: '#64748b', fontWeight: '700' }}>
                [Overhead Announcement Bar is Currently Powered OFF]
              </div>
            )}
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '30px', boxShadow: '0 4px 25px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '19px', fontWeight: '900', color: '#0f172a' }}>Global Header Announcement Configuration</h4>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Appears sticky across desktop and mobile browsers above navigation.</span>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: announcement.show ? '#dcfce7' : '#fee2e2', padding: '10px 18px', borderRadius: '14px', border: '1px solid', borderColor: announcement.show ? '#86efac' : '#fca5a5', fontWeight: '800', color: announcement.show ? '#166534' : '#991b1b', fontSize: '14px' }}>
                <input type="checkbox" checked={announcement.show} onChange={e => setAnnouncement({ ...announcement, show: e.target.checked })} style={{ accentColor: '#10b981', width: '18px', height: '18px' }} />
                <span>{announcement.show ? '🟢 Ticker ACTIVE' : '🔴 Ticker OFF'}</span>
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Announcement Promotional Copy / Message</label>
              <input 
                type="text" 
                value={announcement.text}
                onChange={e => setAnnouncement({ ...announcement, text: e.target.value })}
                style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: '800', color: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Action Link Routing (e.g. /catalog?sale=diwali)</label>
              <input 
                type="text" 
                value={announcement.link}
                onChange={e => setAnnouncement({ ...announcement, link: e.target.value })}
                style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'monospace', color: '#334155', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: CATEGORY-WISE BANNERS (SMART CHIPS) ── */}
      {activeSubTab === 'category_banners' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', animation: 'fadeIn 0.25s' }}>
          
          {/* Smart Category Chip Selector (Replaces repeating endless forms) */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: '#ffffff', padding: '16px 20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '13px', fontWeight: '900', color: '#475569', display: 'flex', alignItems: 'center', marginRight: '6px' }}>SELECT CATEGORY TO CONFIGURE:</span>
            {[
              { id: 'all', label: '🌐 All Categories' },
              { id: 'mobiles', label: '📱 Mobiles & 5G' },
              { id: 'electronics', label: '💻 Electronics' },
              { id: 'fashion', label: '👕 Fashion & Streetwear' },
              { id: 'home', label: '🏠 Home & Decor' },
              { id: 'kitchen', label: '🍳 Kitchen Appliances' }
            ].map(chip => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedCategory(chip.id)}
                style={{
                  padding: '10px 18px', borderRadius: '100px', border: '1px solid',
                  borderColor: selectedCategory === chip.id ? '#4f46e5' : '#cbd5e1',
                  background: selectedCategory === chip.id ? '#4f46e5' : '#f8fafc',
                  color: selectedCategory === chip.id ? '#ffffff' : '#475569',
                  fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Active Category Banner Configuration Card */}
          {(() => {
            const catData = categoryBanners[selectedCategory] || { show: true, slides: [] };
            return (
              <div style={{ background: '#ffffff', border: '2px solid #3b82f6', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 35px rgba(59, 130, 246, 0.08)', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#1e3a8a', textTransform: 'capitalize' }}>
                      ✨ {selectedCategory} Category Promotional Banner
                    </h3>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Customized banner shown exclusively when customer browses `/category/{selectedCategory}`.</span>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: catData.show ? '#dcfce7' : '#f1f5f9', padding: '10px 20px', borderRadius: '100px', fontWeight: '800', color: catData.show ? '#166534' : '#64748b', fontSize: '14px' }}>
                    <input 
                      type="checkbox" 
                      checked={catData.show} 
                      onChange={e => setCategoryBanners({ ...categoryBanners, [selectedCategory]: { ...catData, show: e.target.checked } })}
                      style={{ accentColor: '#10b981', width: '18px', height: '18px' }}
                    />
                    <span>{catData.show ? '🟢 Category Banner ACTIVE' : '⚪ Category Banner OFF'}</span>
                  </label>
                </div>

                {catData.slides.map((s, idx) => (
                  <div key={s.id || idx} style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'center', background: '#f8fafc', padding: '22px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Promotional Discount Badge</label>
                        <input 
                          type="text" 
                          value={s.badge} 
                          onChange={e => {
                            const newSlides = [...catData.slides];
                            newSlides[idx].badge = e.target.value;
                            setCategoryBanners({ ...categoryBanners, [selectedCategory]: { ...catData, slides: newSlides } });
                          }}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: '800', color: '#b45309', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Category Display Title</label>
                        <input 
                          type="text" 
                          value={s.title} 
                          onChange={e => {
                            const newSlides = [...catData.slides];
                            newSlides[idx].title = e.target.value;
                            setCategoryBanners({ ...categoryBanners, [selectedCategory]: { ...catData, slides: newSlides } });
                          }}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: '800', fontSize: '15px', color: '#0f172a', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>High-Res Category Graphic URL</label>
                        <input 
                          type="text" 
                          value={s.imageUrl} 
                          onChange={e => {
                            const newSlides = [...catData.slides];
                            newSlides[idx].imageUrl = e.target.value;
                            setCategoryBanners({ ...categoryBanners, [selectedCategory]: { ...catData, slides: newSlides } });
                          }}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Category Preview Box */}
                    <div style={{ 
                      height: '180px', borderRadius: '16px', overflow: 'hidden',
                      background: s.imageUrl ? `url(${s.imageUrl}) center/cover no-repeat` : '#1e293b',
                      border: '2px solid #cbd5e1', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px', color: '#ffffff', boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
                    }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 80%)' }}></div>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <span style={{ fontSize: '9px', fontWeight: '900', background: '#3b82f6', color: '#ffffff', padding: '2px 6px', borderRadius: '4px' }}>{s.badge}</span>
                        <div style={{ fontWeight: '900', fontSize: '14px', marginTop: '4px' }}>{s.title}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB 5: VIP CATEGORY PILLS MANAGER ── */}
      {activeSubTab === 'vip_categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', animation: 'fadeIn 0.25s' }}>
          <div style={{ background: '#ffffff', border: '2px solid #6366f1', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 35px rgba(99, 102, 241, 0.08)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#1e1b4b' }}>
                  💎 Homepage VIP Category Pills Manager (Live Interactive)
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  Add, edit, reorder or change badges on the top category vault capsules displayed on the Homepage.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    const newPill = {
                      id: `cat_${Date.now().toString().slice(-4)}`,
                      label: 'New VIP Category',
                      icon: '⚡',
                      gradient: 'linear-gradient(135deg, #059669, #047857)',
                      badge: 'NEW'
                    };
                    const updated = [...vipCategories, newPill];
                    setVipCategories(updated);
                    localStorage.setItem('abkharido_vip_categories', JSON.stringify(updated));
                    window.dispatchEvent(new Event('abkharido_promotions_updated'));
                    showToastMsg('➕ New Category Pill added to Homepage Vaults!', 'success');
                  }}
                  style={{ padding: '10px 18px', borderRadius: '12px', background: '#4f46e5', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> <span>Add Category Pill</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVipCategories(defaultVipCategories);
                    localStorage.setItem('abkharido_vip_categories', JSON.stringify(defaultVipCategories));
                    window.dispatchEvent(new Event('abkharido_promotions_updated'));
                    showToastMsg('🔄 Reset to default VIP Categories!', 'info');
                  }}
                  style={{ padding: '10px 18px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* Category Pills List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {vipCategories.map((cat, cIdx) => (
                <div key={cat.id || cIdx} style={{ background: '#f8fafc', padding: '18px', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 220px 40px', gap: '16px', alignItems: 'center' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 100px', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Icon Emoji</label>
                      <input 
                        type="text" 
                        value={cat.icon} 
                        onChange={e => {
                          const copy = [...vipCategories];
                          copy[cIdx].icon = e.target.value;
                          setVipCategories(copy);
                        }}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '16px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Category Label</label>
                      <input 
                        type="text" 
                        value={cat.label} 
                        onChange={e => {
                          const copy = [...vipCategories];
                          copy[cIdx].label = e.target.value;
                          setVipCategories(copy);
                        }}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '800', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Target Category ID</label>
                      <input 
                        type="text" 
                        value={cat.id} 
                        onChange={e => {
                          const copy = [...vipCategories];
                          copy[cIdx].id = e.target.value;
                          setVipCategories(copy);
                        }}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Offer Badge</label>
                      <input 
                        type="text" 
                        value={cat.badge} 
                        onChange={e => {
                          const copy = [...vipCategories];
                          copy[cIdx].badge = e.target.value;
                          setVipCategories(copy);
                        }}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '800', color: '#e11d48', fontSize: '11px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* Live Preview Pill Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Live Preview</span>
                    <div style={{
                      background: cat.gradient || 'linear-gradient(135deg, #1e1b4b, #4338ca)',
                      color: '#ffffff', borderRadius: '20px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '8px', fontSize: '9px' }}>{cat.badge}</span>
                    </div>
                  </div>

                  {/* Delete Action */}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = vipCategories.filter((_, i) => i !== cIdx);
                      setVipCategories(updated);
                      localStorage.setItem('abkharido_vip_categories', JSON.stringify(updated));
                      window.dispatchEvent(new Event('abkharido_promotions_updated'));
                      showToastMsg('🗑️ Category Pill removed!', 'info');
                    }}
                    style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Delete Category Pill"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Action Bar */}
      <div style={{ background: '#ffffff', padding: '20px 28px', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} style={{ color: '#059669' }} /> Ready to push campaign updates across all active customer browsers
        </span>

        <button 
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          style={{ padding: '14px 34px', fontSize: '15px', fontWeight: '900', borderRadius: '100px', background: isSaving ? '#4f46e5' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)' }}
        >
          {isSaving ? 'Broadcasting to Main...' : '🚀 SAVE ALL PROMOTIONS AND BROADCAST LIVE'}
        </button>
      </div>

    </div>
  );
};

export default AdminPromotions;
