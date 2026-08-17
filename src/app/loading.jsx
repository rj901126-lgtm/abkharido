import React from 'react';

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-box {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* Top Announcement Bar Skeleton */}
      <div style={{ height: '32px', backgroundColor: '#1e1b4b' }}></div>

      {/* Header Skeleton */}
      <header style={{ height: '64px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div className="skeleton-box" style={{ width: '150px', height: '32px', borderRadius: '8px' }}></div>
        <div className="skeleton-box" style={{ width: '45%', height: '40px', borderRadius: '24px' }}></div>
        <div style={{ display: 'flex', gap: '14px' }}>
          <div className="skeleton-box" style={{ width: '70px', height: '36px', borderRadius: '8px' }}></div>
          <div className="skeleton-box" style={{ width: '70px', height: '36px', borderRadius: '8px' }}></div>
        </div>
      </header>

      {/* Category Pills Strip Skeleton */}
      <div style={{ backgroundColor: '#ffffff', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px', overflowX: 'hidden' }}>
        {[100, 110, 120, 105, 95, 115, 100].map((w, i) => (
          <div key={i} className="skeleton-box" style={{ width: `${w}px`, height: '38px', borderRadius: '99px', flexShrink: 0 }}></div>
        ))}
      </div>

      <div style={{ maxWidth: '1240px', margin: '16px auto', padding: '0 16px' }}>
        {/* Hero Carousel Skeleton */}
        <div className="skeleton-box" style={{ width: '100%', height: '340px', borderRadius: '24px', marginBottom: '20px' }}></div>

        {/* USP Trust Strip Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-box" style={{ height: '74px', borderRadius: '16px' }}></div>
          ))}
        </div>

        {/* Product Row Section Skeleton */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="skeleton-box" style={{ width: '200px', height: '28px', borderRadius: '6px' }}></div>
            <div className="skeleton-box" style={{ width: '120px', height: '28px', borderRadius: '6px' }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '18px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="skeleton-box" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px' }}></div>
                <div className="skeleton-box" style={{ width: '80%', height: '16px', borderRadius: '4px' }}></div>
                <div className="skeleton-box" style={{ width: '50%', height: '14px', borderRadius: '4px' }}></div>
                <div className="skeleton-box" style={{ width: '60%', height: '20px', borderRadius: '4px' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
