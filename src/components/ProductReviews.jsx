import React, { useState } from 'react';
import { Star, MessageCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ProductReviews = ({ product, productId }) => {
  const { user } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage('Please login to write a review');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token || user.token_override}`
        },
        body: JSON.stringify({ rating, comment })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Review submitted successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const reviews = product?.reviews || [];

  return (
    <div style={{ marginTop: '40px', padding: '30px', background: 'white', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
      <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <MessageCircle color="var(--primary-color)" /> Customer Reviews
      </h3>
      
      {reviews.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>No reviews yet. Be the first to review this product!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          {reviews.map((r, i) => (
            <div key={i} style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong style={{ fontSize: '15px' }}>{r.name}</strong>
                <div style={{ display: 'flex' }}>
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} size={14} fill={idx < r.rating ? '#eab308' : 'none'} color={idx < r.rating ? '#eab308' : '#cbd5e1'} />
                  ))}
                </div>
              </div>
              {r.isVerifiedPurchase && (
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <CheckCircle size={12} /> Verified Purchase
                </div>
              )}
              <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>"{r.comment}"</p>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <div style={{ marginTop: '30px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
          <h4 style={{ fontWeight: '700', marginBottom: '15px' }}>Write a Review</h4>
          <form onSubmit={submitHandler} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Rating</label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', width: '100px' }}>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Very Good</option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Fair</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Comment</label>
              <textarea 
                value={comment} 
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                placeholder="Share your thoughts about this product..."
              ></textarea>
            </div>
            {message && <div style={{ color: message.includes('success') ? 'green' : 'red', fontSize: '13px', fontWeight: 'bold' }}>{message}</div>}
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '12px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start' }}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ marginTop: '20px', padding: '15px', background: '#eff6ff', color: '#1e40af', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>
          Please log in to write a review.
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
