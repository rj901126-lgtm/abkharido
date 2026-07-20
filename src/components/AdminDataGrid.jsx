import React, { useState, useEffect } from 'react';
import { Package, Trash2, Edit, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminDataGrid = ({ onEditProduct }) => {
  const { showToast } = useApp();
  const [data, setData] = useState({ products: [], total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPaginatedProducts = async (page = 1, searchQuery = search, catQuery = category) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchQuery,
        category: catQuery
      });
      const res = await fetch(`/api/admin/products/paginated?${queryParams.toString()}`, {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        showToast('Failed to load inventory', 'error');
      }
    } catch (err) {
      showToast('Network error loading inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaginatedProducts(1, search, category);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPaginatedProducts(1, search, category);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete product ${id}?`)) return;
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        showToast('Product deleted successfully', 'success');
        fetchPaginatedProducts(data.page, search, category);
      } else {
        showToast('Failed to delete product', 'error');
      }
    } catch (err) {
      showToast('Network error deleting product', 'error');
    }
  };

  return (
    <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 className="admin-form-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
        <div style={{ padding: '8px', background: '#e0e7ff', borderRadius: '8px', color: '#4f46e5' }}><Package size={20} /></div>
        Live Inventory Data Grid
      </h3>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input 
            type="text"
            className="admin-form-input"
            placeholder="Search products by Name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 14px 8px 34px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
        <select 
          className="admin-form-input" 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: '150px' }}
        >
          <option value="">All Categories</option>
          <option value="mobiles">Mobiles</option>
          <option value="electronics">Electronics</option>
          <option value="fashion">Fashion</option>
          <option value="home">Home</option>
          <option value="appliances">Appliances</option>
        </select>
        <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', height: '36px' }}>
          Search
        </button>
      </form>

      <div className="admin-table-wrapper" style={{ minHeight: '400px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading inventory...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>ID / Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Payouts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.products.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                data.products.map(prod => (
                  <tr key={prod.id} style={{ transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 12px' }}>
                      <img src={prod.image} alt={prod.name} className="admin-prod-thumb" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px', lineHeight: '1.4' }}>{(prod.name || '').substring(0, 40)}{(prod.name?.length > 40 ? '...' : '')}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>ID: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#334155' }}>{prod.id || ''}</code></div>
                    </td>
                    <td style={{ textTransform: 'capitalize', color: '#475569', fontWeight: '500' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>{prod.category || 'Uncategorized'}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>₹{(prod.price || 0).toLocaleString('en-IN')}</div>
                      {prod.originalPrice > prod.price && (
                        <div style={{ fontSize: '12px', textDecoration: 'line-through', color: '#94a3b8', marginTop: '2px' }}>₹{(prod.originalPrice || 0).toLocaleString('en-IN')}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                          <span style={{ color: '#047857', fontWeight: '700', fontSize: '12px' }}>Creator: {((prod.influencerCommissionRate || 0) * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                          <span style={{ color: '#b45309', fontWeight: '700', fontSize: '12px' }}>User: {((prod.userCommissionRate || 0) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          className="admin-action-btn" 
                          onClick={() => onEditProduct(prod)}
                          title="Edit product"
                          style={{ padding: '8px 14px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: '600', fontSize: '12px', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='none'}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button 
                          className="admin-action-btn-danger" 
                          onClick={() => handleDelete(prod.id)}
                          title="Delete product"
                          style={{ padding: '8px 14px', borderRadius: '6px', background: '#fef2f2', color: '#e11d48', border: '1px solid #fecaca', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: '600', fontSize: '12px', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='none'}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {data.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Showing {data.products.length} of {data.total} products
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-outline" 
              disabled={data.page === 1 || loading}
              onClick={() => fetchPaginatedProducts(data.page - 1, search, category)}
              style={{ padding: '6px 12px', height: '32px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', fontWeight: 'bold' }}>
              Page {data.page} of {data.totalPages}
            </div>
            <button 
              className="btn btn-outline" 
              disabled={data.page === data.totalPages || loading}
              onClick={() => fetchPaginatedProducts(data.page + 1, search, category)}
              style={{ padding: '6px 12px', height: '32px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDataGrid;
