"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft, Home, Search, Smartphone, Laptop, Shirt, Home as HomeIcon, Tv } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchVal.trim())}`);
    } else {
      router.push('/catalog');
    }
  };

  const popularCategories = [
    { label: 'Mobiles', slug: 'mobiles', icon: '📱' },
    { label: 'Electronics', slug: 'electronics', icon: '🎧' },
    { label: 'Fashion', slug: 'fashion', icon: '👗' },
    { label: 'Home & Living', slug: 'home', icon: '🏠' },
    { label: 'Appliances', slug: 'appliances', icon: '🫧' },
  ];

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 20px',
      textAlign: 'center',
      background: 'linear-gradient(180deg, #f8faff 0%, #ffffff 100%)',
      fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Icon Circle */}
      <div style={{
        width: '110px',
        height: '110px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: '0 20px 40px rgba(79, 70, 229, 0.25)',
      }}>
        <ShoppingBag size={50} color="#ffffff" strokeWidth={1.5} />
      </div>

      <span style={{
        display: 'inline-block',
        padding: '6px 16px',
        background: 'rgba(79, 70, 229, 0.1)',
        color: '#4f46e5',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '800',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: '12px',
      }}>
        HTTP 404 — Item Not Found
      </span>

      <h1 style={{
        fontSize: 'clamp(26px, 4.5vw, 34px)',
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: '10px',
        letterSpacing: '-0.5px',
      }}>
        Product or Page Not Found
      </h1>

      <p style={{
        fontSize: '15px',
        color: '#64748b',
        maxWidth: '480px',
        lineHeight: '1.6',
        marginBottom: '24px',
      }}>
        The product you are looking for is either no longer available or the link may be incorrect. Try searching our verified catalog below!
      </p>

      {/* Interactive Search Bar on 404 */}
      <form onSubmit={handleSearchSubmit} style={{ maxWidth: '440px', width: '100%', marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '6px 8px 6px 16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <Search size={18} color="#94a3b8" style={{ marginRight: '8px', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search phones, laptops, shoes..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              fontFamily: "'Outfit', sans-serif",
              color: '#0f172a',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Popular Category Shortcuts */}
      <div style={{ maxWidth: '520px', width: '100%', marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
          ✨ Popular Departments
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {popularCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/catalog?category=${cat.slug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                color: '#1e293b',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '700',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'center',
        maxWidth: '440px',
        width: '100%',
      }}>
        <Link
          href="/"
          style={{
            flex: '1 1 180px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 24px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: '800',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)',
            transition: 'transform 0.2s ease',
          }}
        >
          <Home size={18} /> Continue Shopping
        </Link>

        <Link
          href="/catalog"
          style={{
            flex: '1 1 180px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 24px',
            background: '#ffffff',
            color: '#4f46e5',
            border: '2px solid #e0e7ff',
            textDecoration: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: '800',
            transition: 'all 0.2s ease',
          }}
        >
          <Search size={18} /> Explore Catalog
        </Link>
      </div>
    </div>
  );
}

