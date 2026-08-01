import React, { useState, useEffect } from 'react';
import { Package, Trash2, Edit, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportToCSV } from '../utils/csvExport';

const AdminDataGrid = ({ onEditProduct }) => {
  const { showToast, addProduct } = useApp();
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products?${queryParams.toString()}`, {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        showToast('Failed to load inventory', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Network error loading inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        showToast('Product deleted successfully', 'success');
        fetchPaginatedProducts(data.page, search, category);
      } else {
        showToast('Failed to delete product', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Network error deleting product', 'error');
    }
  };

  const handleQuickUpdateStock = async (productObj) => {
    const newStockStr = window.prompt(`Enter new stock quantity for ${productObj.name}:`, productObj.stock || '0');
    if (newStockStr === null) return;
    const newStock = Number(newStockStr);
    if (isNaN(newStock)) {
      showToast('Invalid stock quantity', 'error');
      return;
    }

    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productObj.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ stock: newStock })
      });
      
      if (res.ok) {
        showToast(`Stock updated to ${newStock} successfully!`, 'success');
        fetchPaginatedProducts(data.page, search, category);
      } else {
        showToast('Failed to update stock', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Error updating stock', 'error');
    }
  };

  const handleClone = (prod) => {
    if (!window.confirm(`Clone product "${prod.name}"?`)) return;
    
    // Create a deeply cloned copy without ID
    const newProduct = JSON.parse(JSON.stringify(prod));
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    newProduct.id = `${prod.id}-copy-${randomSuffix}`;
    newProduct.name = `${prod.name} (Copy)`;
    
    // Add product via context
    if (addProduct) {
      addProduct(newProduct);
      showToast(`Product cloned successfully! ID: ${newProduct.id}`, 'success');
      // Refresh the grid
      setTimeout(() => fetchPaginatedProducts(data.page, search, category), 500);
    } else {
      showToast('Add product function not available', 'error');
    }
  };

  return (
    <div className="admin-inventory-module" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Glassmorphic Header Area */}
      <div className="admin-panel-card" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white', borderRadius: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontFamily: 'Outfit, sans-serif', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={28} color="#818cf8" /> Live Inventory Engine
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '15px' }}>
            Global PIM (Product Information Management) and real-time stock levels.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => exportToCSV(data.products, 'abkharido_inventory.csv')}
          style={{ padding: '14px 28px', fontSize: '16px', borderRadius: '100px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Package size={18} /> Export Inventory CSV
        </button>
      </div>
      
      <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)', background: '#f8fafc' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px' }}>
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
            <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', borderRadius: '100px', height: '48px', fontSize: '15px' }}>
              Search Database
            </button>
          </form>
        </div>

      <div className="admin-table-wrapper" style={{ border: 'none', boxShadow: 'none', borderRadius: 0, minHeight: '400px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{ color: '#64748b', fontWeight: '500' }}>Loading inventory...</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>ID / Name</th>
                <th>Category</th>
                <th>SKU / Stock</th>
                <th>Price</th>
                <th>Payouts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.products.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <code style={{ fontSize: '11px', color: '#64748b' }}>{prod.sku || 'NO-SKU'}</code>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 'bold', color: prod.stock < 10 ? '#ef4444' : '#10b981', fontSize: '13px' }}>
                            {prod.stock || 0} units
                          </span>
                          {prod.stock < 10 && (
                            <span style={{ background: '#fee2e2', color: '#ef4444', fontSize: '10px', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold' }}>LOW</span>
                          )}
                        </div>
                        <button 
                          onClick={() => handleQuickUpdateStock(prod)}
                          style={{ background: 'none', border: '1px dashed #cbd5e1', color: '#475569', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', marginTop: '2px' }}
                        >
                          Update
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>₹{(prod.price || 0).toLocaleString('en-IN')}</div>
                      {prod.originalPrice > prod.price && (
                        <div style={{ fontSize: '12px', textDecoration: 'line-through', color: '#94a3b8', marginTop: '2px' }}>₹{(prod.originalPrice || 0).toLocaleString('en-IN')}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                        <span style={{ color: '#b45309', fontWeight: '700', fontSize: '13px' }}>User: {((prod.userCommissionRate || 0.005) * 100).toFixed(1)}%</span>
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
                          className="admin-action-btn" 
                          onClick={() => handleClone(prod)}
                          title="Clone product"
                          style={{ padding: '8px 14px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: '600', fontSize: '12px', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='none'}
                        >
                          <Package size={14} /> Clone
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid var(--admin-border)' }}>
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
    </div>
  );
};

export default AdminDataGrid;
