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
    <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 className="admin-form-title"><Package size={18} color="var(--primary-color)" /> Live Inventory Data Grid</h3>
      
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
                  <tr key={prod.id}>
                    <td>
                      <img src={prod.image} alt={prod.name} className="admin-prod-thumb" />
                    </td>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{(prod.name || '').substring(0, 40)}...</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ID: <code>{prod.id || ''}</code></div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{prod.category || ''}</td>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>₹{(prod.price || 0).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '11px', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>₹{(prod.originalPrice || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '12px' }}>Creator: {((prod.influencerCommissionRate || 0) * 100).toFixed(1)}%</div>
                      <div style={{ color: '#e68f00', fontWeight: 'bold', fontSize: '12px' }}>User: {((prod.userCommissionRate || 0) * 100).toFixed(1)}%</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="admin-action-btn" 
                          onClick={() => onEditProduct(prod)}
                          title="Edit product"
                        >
                          <Edit size={14} color="var(--primary-color)" /> Edit
                        </button>
                        <button 
                          className="admin-action-btn-danger" 
                          onClick={() => handleDelete(prod.id)}
                          title="Delete product"
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
