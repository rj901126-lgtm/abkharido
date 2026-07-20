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
      const res = await fetch('/api/v2/cms/layout/home_page');
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
      await fetch('/api/v2/cms/layout/home_page', {
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

  if (loading) return <div>Loading CMS Engine...</div>;

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
          <div key={comp.id} style={{ display: 'flex', gap: '16px', padding: '16px', background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '8px', alignItems: 'center' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-outline" style={{ padding: '4px' }} onClick={() => moveUp(idx)}><MoveUp size={14} /></button>
              <button className="btn btn-outline" style={{ padding: '4px' }} onClick={() => moveDown(idx)}><MoveDown size={14} /></button>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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

            <button className="btn btn-outline" style={{ color: '#d32f2f', borderColor: '#d32f2f', alignSelf: 'flex-start' }} onClick={() => removeComponent(idx)}>
              <Trash2 size={16} />
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
