"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Heart, ShoppingBag, ArrowRight, Trash2, ArrowLeft } from 'lucide-react';
import LazyImage from '../../components/LazyImage';

export default function WishlistClient() {
  const router = useRouter();
  const { wishlist, toggleWishlist, products, addToCart, showToast, currentUser } = useApp();

  const wishlistProducts = products ? products.filter(p => wishlist?.includes(p.id)) : [];
  const recommendedProducts = products ? products.slice(0, 4) : [];

  return (
    <div className="container animate-fade-in" style={{ padding: '24px 16px 80px', minHeight: '80vh', maxWidth: '1100px' }}>
      {/* Header breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          onClick={() => router.push('/')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={16} /> Back to Shop
        </button>
        {!currentUser && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '6px 14px', fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>
            Guest Wishlist — <span onClick={() => router.push('/login?callbackUrl=/wishlist')} style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: '800' }}>Sign In</span> to sync across devices
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={20} color="#e11d48" fill="#e11d48" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              My Wishlist ({wishlistProducts.length})
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
              Items you have saved for later
            </p>
          </div>
        </div>

        {wishlistProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Heart size={36} color="#e11d48" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Your Wishlist is Empty</h2>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.5' }}>
              Explore our trending smartphones, designer fashion, and electronics deals to save your favorites.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => router.push('/catalog')}
              style={{ padding: '12px 28px', borderRadius: '14px', fontWeight: '700', fontSize: '15px' }}
            >
              Explore Products <ArrowRight size={16} />
            </button>

            {recommendedProducts.length > 0 && (
              <div style={{ marginTop: '48px', textAlign: 'left', borderTop: '1px solid #f1f5f9', paddingTop: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>Trending Deals for You</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {recommendedProducts.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => router.push(`/product/${p.id}`)}
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', cursor: 'pointer', transition: 'transform 0.2s' }}
                    >
                      <LazyImage src={p.image} alt={p.name} style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '8px' }} />
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>₹{(p.price || 0).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {wishlistProducts.map(p => (
              <div 
                key={p.id}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #f1f5f9',
                  borderRadius: '20px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(p.id);
                    showToast('Item removed from wishlist', 'info');
                  }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#fee2e2',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                  title="Remove from Wishlist"
                >
                  <Trash2 size={15} color="#e11d48" />
                </button>

                <div 
                  onClick={() => router.push(`/product/${p.id}`)}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <LazyImage src={p.image} alt={p.name} style={{ width: '140px', height: '140px', objectFit: 'contain', marginBottom: '12px' }} />
                  <div style={{ width: '100%', fontSize: '14px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#059669', marginTop: '6px' }}>
                    ₹{(p.price || 0).toLocaleString('en-IN')}
                  </div>
                  {p.originalPrice && p.originalPrice > p.price && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                      ₹{(p.originalPrice || 0).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      addToCart(p, 1);
                      showToast('Added to cart! 🛍️', 'success');
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '800', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <ShoppingBag size={15} /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
