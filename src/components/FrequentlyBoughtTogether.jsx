import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';

const FrequentlyBoughtTogether = ({ category, currentProductId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useApp();

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await fetch(`/api/products?category=${category}&limit=4`);
        const data = await res.json();
        if (data.products) {
          // Filter out the current product and take up to 3
          const related = data.products.filter(p => p._id !== currentProductId).slice(0, 3);
          setProducts(related);
        }
      } catch (err) {
        console.error('Failed to fetch related products:', err);
      }
      setLoading(false);
    };

    if (category) {
      fetchRelated();
    }
  }, [category, currentProductId]);

  if (loading || products.length === 0) return null;

  return (
    <div style={{ marginTop: '40px', padding: '30px', background: 'white', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
      <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Frequently Bought Together</h3>
      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
        {products.map(p => (
          <div key={p._id} style={{ minWidth: '220px', maxWidth: '220px', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <Link href={`/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <img src={p.image} alt={p.name} style={{ width: '100%', height: '150px', objectFit: 'contain', marginBottom: '10px' }} />
              <div style={{ fontSize: '14px', fontWeight: 'bold', height: '40px', overflow: 'hidden' }}>{p.name}</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#059669', margin: '8px 0' }}>₹{p.price?.toLocaleString('en-IN')}</div>
            </Link>
            <button 
              onClick={() => addToCart(p)}
              style={{ marginTop: 'auto', padding: '8px', background: 'white', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            >
              <ShoppingCart size={14} /> Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;
