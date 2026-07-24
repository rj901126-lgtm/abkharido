import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, MoveUp, MoveDown, LayoutTemplate, Image as ImageIcon, Grid, Clock, GripVertical } from 'lucide-react';

const AdminCMSBuilder = () => {
  const [layout, setLayout] = useState({ type: 'home_page', components: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLayout();
  }, []);

  const fetchLayout = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/cms/layout/home_page`);
      if (res.ok) {
        const data = await res.json();
        setLayout(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/cms/layout/home_page`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: layout.components })
      });
      // Simulating a nice delay for UI feedback
      setTimeout(() => setSaving(false), 800);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const addComponent = () => {
    const newComp = {
      id: Date.now().toString(),
      type: 'banner',
      title: 'New Promotional Banner',
      order: layout.components.length + 1,
      data: 'https://via.placeholder.com/1200x400?text=Upload+World+Class+Banner'
    };
    setLayout({ ...layout, components: [...layout.components, newComp] });
  };

  const updateComponent = (index, field, value) => {
    const updated = [...layout.components];
    updated[index][field] = value;
    setLayout({ ...layout, components: updated });
  };

  const removeComponent = (index) => {
    const updated = [...layout.components];
    updated.splice(index, 1);
    setLayout({ ...layout, components: updated });
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const updated = [...layout.components];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setLayout({ ...layout, components: updated });
  };

  const moveDown = (index) => {
    if (index === layout.components.length - 1) return;
    const updated = [...layout.components];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setLayout({ ...layout, components: updated });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#64748b', fontWeight: '500' }}>Loading Enterprise CMS Engine...</div>
      </div>
    );
  }

  const getIconForType = (type) => {
    switch(type) {
      case 'banner': return <ImageIcon size={24} color="#ec4899" />;
      case 'category_row': return <Grid size={24} color="#8b5cf6" />;
      case 'deals_row': return <Clock size={24} color="#f59e0b" />;
      default: return <LayoutTemplate size={24} color="#64748b" />;
    }
  };

  const getGradientForType = (type) => {
    switch(type) {
      case 'banner': return 'linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%)';
      case 'category_row': return 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)';
      case 'deals_row': return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
      default: return '#f1f5f9';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Area */}
      <div className="admin-panel-card" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white', borderRadius: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontFamily: 'Outfit, sans-serif', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LayoutTemplate size={28} color="#818cf8" /> Enterprise Storefront Builder
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '15px' }}>
            Visually construct your homepage with world-class drag-and-drop components.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleSave} 
          disabled={saving} 
          style={{ padding: '14px 28px', fontSize: '16px', borderRadius: '100px', background: saving ? '#4f46e5' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)', border: 'none', color: 'white' }}
        >
          <Save size={18} style={{ marginRight: '8px' }} /> {saving ? 'Publishing...' : 'Publish to Live'}
        </button>
      </div>

      {/* Builder Canvas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {layout.components.map((comp, idx) => (
          <div 
            key={comp.id} 
            className="admin-panel-card" 
            style={{ 
              display: 'flex', 
              gap: '24px', 
              padding: '24px', 
              alignItems: 'stretch',
              position: 'relative',
              overflow: 'visible'
            }}
          >
            {/* Left Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', paddingRight: '16px', borderRight: '1px solid #e2e8f0' }}>
              <div style={{ cursor: 'grab', color: '#cbd5e1', padding: '4px' }}><GripVertical size={20} /></div>
              <button onClick={() => moveUp(idx)} disabled={idx===0} style={{ background: 'none', border: 'none', color: idx===0 ? '#e2e8f0' : '#64748b', cursor: idx===0 ? 'not-allowed' : 'pointer', transition: 'color 0.2s' }}><MoveUp size={20} /></button>
              <button onClick={() => moveDown(idx)} disabled={idx===layout.components.length-1} style={{ background: 'none', border: 'none', color: idx===layout.components.length-1 ? '#e2e8f0' : '#64748b', cursor: idx===layout.components.length-1 ? 'not-allowed' : 'pointer', transition: 'color 0.2s' }}><MoveDown size={20} /></button>
            </div>

            {/* Component Icon / Preview */}
            <div style={{ width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: getGradientForType(comp.type), borderRadius: '16px', padding: '16px', gap: '12px' }}>
              {getIconForType(comp.type)}
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                {comp.type.replace('_', ' ')}
              </span>
            </div>

            {/* Editor Form */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Block Type</label>
                  <select 
                    className="admin-input" 
                    value={comp.type}
                    onChange={(e) => updateComponent(idx, 'type', e.target.value)}
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', height: '44px', fontWeight: '600', color: '#0f172a' }}
                  >
                    <option value="banner">Hero Banner Ad (World Class)</option>
                    <option value="deals_row">Flash Deals Timer Row</option>
                    <option value="category_row">Dynamic Category Grid</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Section Title / Alt Text</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={comp.title}
                    onChange={(e) => updateComponent(idx, 'title', e.target.value)}
                    placeholder="e.g. Mega Summer Sale"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', height: '44px' }}
                  />
                </div>
              </div>

              {comp.type === 'banner' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Banner Image URL (High-Res recommended)</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={comp.data}
                    onChange={(e) => updateComponent(idx, 'data', e.target.value)}
                    placeholder="https://your-cdn.com/banner.jpg"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', height: '44px', width: '100%' }}
                  />
                  {comp.data && (
                    <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', height: '120px', background: `url(${comp.data}) center/cover no-repeat` }}></div>
                  )}
                </div>
              )}

              {comp.type === 'category_row' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Link to Category Slug</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={comp.data}
                    onChange={(e) => updateComponent(idx, 'data', e.target.value)}
                    placeholder="e.g. electronics"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', height: '44px', width: '100%' }}
                  />
                </div>
              )}
            </div>

            {/* Remove Action */}
            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
              <button 
                className="btn btn-outline" 
                style={{ color: '#ef4444', borderColor: 'transparent', background: '#fee2e2', borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                title="Remove Block" 
                onClick={() => removeComponent(idx)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button 
        className="btn btn-outline" 
        onClick={addComponent} 
        style={{ 
          alignSelf: 'center', 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center', 
          marginTop: '20px',
          padding: '16px 32px',
          borderRadius: '100px',
          border: '2px dashed #cbd5e1',
          background: 'transparent',
          color: '#64748b',
          fontSize: '15px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.background = '#e0e7ff'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
      >
        <Plus size={20} /> Add New Storefront Block
      </button>

    </div>
  );
};

export default AdminCMSBuilder;
