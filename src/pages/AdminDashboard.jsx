import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  PlusCircle, 
  Trash2, 
  Settings, 
  Package, 
  Image, 
  Tag, 
  DollarSign, 
  Coins, 
  Layers,
  ArrowLeft,
  X,
  FileText
} from 'lucide-react';
import '../assets/styles/admin.css';

const AdminDashboard = ({ onNavigate }) => {
  const { products, addProduct, removeProduct, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'orders'
  const [adminOrders, setAdminOrders] = useState([]);

  // Fetch all orders for management
  const fetchAllOrders = async () => {
    try {
      const res = await fetch('/api/orders?email=admin');
      if (res.ok) {
        const data = await res.json();
        setAdminOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    }
  };

  React.useEffect(() => {
    fetchAllOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Order milestone updated to ${newStatus}!`, 'success');
        fetchAllOrders();
      } else {
        showToast('Failed to update status.', 'error');
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  // --- Add Product Form State ---
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('electronics');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [rating, setRating] = useState('4.5');
  const [reviewsCount, setReviewsCount] = useState('10');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState(true);

  // Dynamic spec list key-value rows
  const [specs, setSpecs] = useState([
    { key: 'Brand', value: '' },
    { key: 'Model', value: '' }
  ]);

  // Dynamic commission rates (pre-filled on category change for helper guidance)
  const [infCommission, setInfCommission] = useState('0.03'); // 3%
  const [userCommission, setUserCommission] = useState('0.012'); // 1.2%

  // Update commission presets automatically when changing category
  const handleCategoryChange = (cat) => {
    setCategory(cat);
    switch (cat) {
      case 'fashion':
        setInfCommission('0.07');
        setUserCommission('0.03');
        break;
      case 'home':
        setInfCommission('0.05');
        setUserCommission('0.02');
        break;
      case 'appliances':
        setInfCommission('0.04');
        setUserCommission('0.015');
        break;
      case 'electronics':
        setInfCommission('0.03');
        setUserCommission('0.012');
        break;
      case 'mobiles':
        setInfCommission('0.02');
        setUserCommission('0.005');
        break;
      default:
        break;
    }
  };

  const handleAddSpecRow = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (idx) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx, field, value) => {
    const updated = specs.map((spec, i) => {
      if (i === idx) {
        return { ...spec, [field]: value };
      }
      return spec;
    });
    setSpecs(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!id || !name || !price || !originalPrice || !image || !description) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    // Clean specifications (filter empty rows)
    const cleanSpecs = specs.filter(s => s.key.trim() !== '' && s.value.trim() !== '');

    // Construct product object
    const newProduct = {
      id: id.toLowerCase().trim().replace(/[\s\W]+/g, '-'),
      name,
      category,
      price: Number(price),
      originalPrice: Number(originalPrice),
      rating: Number(rating),
      reviewsCount: Number(reviewsCount),
      image,
      description,
      specifications: cleanSpecs,
      influencerCommissionRate: Number(infCommission),
      userCommissionRate: Number(userCommission),
      inStock
    };

    // Call context to append to products state list
    addProduct(newProduct);

    // Clear form
    setId('');
    setName('');
    setPrice('');
    setOriginalPrice('');
    setImage('');
    setDescription('');
    setSpecs([
      { key: 'Brand', value: '' },
      { key: 'Model', value: '' }
    ]);
  };

  return (
    <div className="container admin-container animate-fade-in">
      
      {/* Header bar */}
      <div className="admin-header">
        <div className="admin-title-area">
          <h1 className="admin-title"><Settings size={22} color="var(--primary-color)" /> Backend Inventory Controller</h1>
          <span className="admin-subtitle">Direct Warehousing - Add, remove, and audit our products database.</span>
        </div>
        <button className="btn btn-outline" onClick={() => onNavigate('home')}>
          <ArrowLeft size={16} /> Back to Storefront
        </button>
      </div>

      {/* Admin Tab controls */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #eaeaea', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          <Package size={16} /> Manage Inventory ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          <FileText size={16} /> Manage Orders ({adminOrders.length})
        </button>
      </div>

      {/* CONDITIONAL RENDER: ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="admin-form-title"><FileText size={18} color="var(--primary-color)" /> Platform Orders List</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Email</th>
                  <th>Items Detail</th>
                  <th>Total Amount</th>
                  <th>Milestone Status</th>
                  <th>Payment Info</th>
                  <th>Quick Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminOrders.map(o => (
                  <tr key={o.id}>
                    <td><code>{o.id}</code></td>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{o.customerUsername}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{o.date}</div>
                    </td>
                    <td>
                      {o.items.map(item => (
                        <div key={item.product.id} style={{ fontSize: '12px' }}>
                          • {item.product.name.substring(0, 20)}... (x{item.quantity})
                        </div>
                      ))}
                    </td>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>₹{o.finalAmount.toLocaleString('en-IN')}</div>
                      {o.coinsDiscountValue > 0 && <div style={{ fontSize: '11px', color: '#e68f00' }}>(-{o.coinsDiscountValue} Coins)</div>}
                    </td>
                    <td>
                      <span className={`badge ${
                        o.status === 'Delivered' ? 'badge-success' : 
                        o.status === 'CANCELLED' ? 'badge-danger' : 'badge-info'
                      }`} style={{ fontSize: '11px' }}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>Mode: <strong>{o.paymentMethod}</strong></div>
                      <div style={{ fontSize: '11px', color: o.paymentStatus === 'SUCCESS' ? 'var(--success)' : 'var(--error)' }}>
                        {o.paymentStatus}
                      </div>
                    </td>
                    <td>
                      {o.status !== 'CANCELLED' && o.status !== 'Delivered' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <select 
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                            style={{ fontSize: '12px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                          >
                            <option value="Processing">Processing</option>
                            <option value="Packed">Packed</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>
                      )}
                      {(o.status === 'CANCELLED' || o.status === 'Delivered') && (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONDITIONAL RENDER: INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="admin-grid">
        
        {/* LEFT COLUMN: PRODUCTS AUDIT LIST */}
        <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="admin-form-title"><Package size={18} color="var(--primary-color)" /> Live Inventory ({products.length} Products)</h3>
          
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>ID / Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Creator Payout</th>
                  <th>User Payout</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => (
                  <tr key={prod.id}>
                    <td>
                      <img src={prod.image} alt={prod.name} className="admin-prod-thumb" />
                    </td>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{prod.name.substring(0, 40)}...</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ID: <code>{prod.id}</code></div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{prod.category}</td>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>₹{prod.price.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '11px', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>₹{prod.originalPrice.toLocaleString('en-IN')}</div>
                    </td>
                    <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{(prod.influencerCommissionRate * 100).toFixed(1)}%</td>
                    <td style={{ color: '#e68f00', fontWeight: 'bold' }}>{(prod.userCommissionRate * 100).toFixed(1)}%</td>
                    <td>
                      <button 
                        className="admin-action-btn-danger" 
                        onClick={() => removeProduct(prod.id)}
                        title="Remove product from store"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: ADD NEW PRODUCT FORM */}
        <div className="admin-panel-card">
          <h3 className="admin-form-title"><PlusCircle size={18} color="var(--primary-color)" /> Add New Product</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div className="form-group">
              <label className="form-label-txt">Product ID (Unique - lowercase, no spaces)*</label>
              <input 
                type="text" 
                placeholder="e.g. iphone-16-pro" 
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="form-input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label-txt">Product Display Name*</label>
              <input 
                type="text" 
                placeholder="e.g. Apple iPhone 16 Pro (Titanium, 128 GB)" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label-txt">Category*</label>
              <select 
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="form-input-field"
              >
                <option value="mobiles">Mobiles</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Living</option>
                <option value="appliances">Appliances</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label-txt">Selling Price (₹)*</label>
                <input 
                  type="number" 
                  placeholder="Selling Price" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label-txt">Original Price (₹)*</label>
                <input 
                  type="number" 
                  placeholder="Original Price" 
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label-txt">Influencer Cash rate*</label>
                <input 
                  type="number" 
                  step="0.005"
                  placeholder="e.g. 0.07" 
                  value={infCommission}
                  onChange={(e) => setInfCommission(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label-txt">User Coins rate*</label>
                <input 
                  type="number" 
                  step="0.001"
                  placeholder="e.g. 0.03" 
                  value={userCommission}
                  onChange={(e) => setUserCommission(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label-txt">Image URL*</label>
              <input 
                type="url" 
                placeholder="https://images.unsplash.com/..." 
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="form-input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label-txt">Description*</label>
              <textarea 
                placeholder="Product description and features..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input-field"
                style={{ height: '80px', resize: 'vertical' }}
                required
              />
            </div>

            {/* Specifications editor list */}
            <div className="form-group">
              <label className="form-label-txt">Technical Specifications</label>
              {specs.map((spec, idx) => (
                <div key={idx} className="spec-builder-row">
                  <input 
                    type="text" 
                    placeholder="Key (e.g. Brand)" 
                    value={spec.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    className="spec-builder-input"
                  />
                  <input 
                    type="text" 
                    placeholder="Value (e.g. Apple)" 
                    value={spec.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    className="spec-builder-input"
                  />
                  <span className="spec-remove-btn" onClick={() => handleRemoveSpecRow(idx)}>
                    <X size={16} />
                  </span>
                </div>
              ))}
              <span className="spec-add-btn" onClick={handleAddSpecRow}>
                <PlusCircle size={14} /> Add Row
              </span>
            </div>

            <button type="submit" className="btn btn-accent" style={{ marginTop: '12px' }}>
              ADD PRODUCT TO STORE
            </button>
          </form>
        </div>

      </div>
      )}
    </div>
  );
};

export default AdminDashboard;
