import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, MoveUp, MoveDown, LayoutTemplate } from 'lucide-react';

const AdminCMSBuilder = () => {
  const [layout, setLayout] = useState({ type: 'home_page', components: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLayout();
  }, []);

  const fetchLayout = async () => {
    try {
      const res = await fetch('/api/cms/layout/home_page');
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
      // In a real app with auth, pass JWT token
      await fetch('/api/cms/layout/home_page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: layout.components })
      });
      alert('Layout saved successfully! Refresh home page to see changes.');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addComponent = () => {
    const newComp = {
      id: Date.now().toString(),
      type: 'category_row',
      title: 'New Section',
      order: layout.components.length + 1,
      data: ''
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
        <div style={{ color: '#64748b', fontWeight: '500' }}>Loading CMS Engine...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="admin-form-title" style={{ margin: 0 }}>
          <LayoutTemplate size={18} color="var(--primary-color)" /> Dynamic Home Page Builder
        </h3>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>
      
      <p style={{ fontSize: '14px', color: '#666', marginTop: '-10px' }}>
        Add, remove, or reorder the rows that appear on the AbKharido home page.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {layout.components.map((comp, idx) => (
          <div key={comp.id} className="admin-panel-card" style={{ display: 'flex', gap: '20px', padding: '24px', alignItems: 'flex-start', borderLeft: '4px solid var(--primary-color)', transition: 'all 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '30px' }}>
              <button className="btn btn-outline" style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#64748b' }} onClick={() => moveUp(idx)}><MoveUp size={16} /></button>
              <button className="btn btn-outline" style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#64748b' }} onClick={() => moveDown(idx)}><MoveDown size={16} /></button>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <label className="admin-input-label">Row Type</label>
                <select 
                  className="admin-input" 
                  value={comp.type}
                  onChange={(e) => updateComponent(idx, 'type', e.target.value)}
                >
                  <option value="deals_row">Deals of the Day (Timer)</option>
                  <option value="category_row">Category Product Row</option>
                  <option value="banner">Static Banner Ad</option>
                </select>
              </div>

              <div>
                <label className="admin-input-label">Display Title</label>
                <input 
                  type="text" 
                  className="admin-input" 
                  value={comp.title}
                  onChange={(e) => updateComponent(idx, 'title', e.target.value)}
                  placeholder="e.g. Best of Electronics"
                />
              </div>

              {comp.type === 'category_row' && (
                <div>
                  <label className="admin-input-label">Linked Category Slug</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={comp.data}
                    onChange={(e) => updateComponent(idx, 'data', e.target.value)}
                    placeholder="e.g. electronics"
                  />
                </div>
              )}
            </div>

            <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: 'transparent', background: '#fee2e2', borderRadius: '50%', padding: '10px', alignSelf: 'center' }} title="Remove Row" onClick={() => removeComponent(idx)}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn-outline" onClick={addComponent} style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
        <Plus size={16} /> Add New Row
      </button>

    </div>
  );
};

export default AdminCMSBuilder;
