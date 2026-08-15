"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      background: 'linear-gradient(180deg, #f8faff 0%, #ffffff 100%)',
      fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        width: '120px',
        height: '120px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 20px 50px rgba(79, 70, 229, 0.3)',
      }}>
        <ShoppingBag size={56} color="#ffffff" strokeWidth={1.5} />
      </div>

      <span style={{
        display: 'inline-block',
        padding: '6px 16px',
        background: 'rgba(79, 70, 229, 0.1)',
        color: '#4f46e5',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: '12px',
      }}>
        Error 404 — Page Not Found
      </span>

      <h1 style={{
        fontSize: 'clamp(28px, 5vw, 36px)',
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: '12px',
        letterSpacing: '-0.5px',
      }}>
        Looking for a Great Deal?
      </h1>

      <p style={{
        fontSize: '15px',
        color: '#64748b',
        maxWidth: '460px',
        lineHeight: '1.6',
        marginBottom: '32px',
      }}>
        The page you are looking for might have been moved, renamed, or is temporarily unavailable. Let&apos;s get you back on track!
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'center',
        maxWidth: '420px',
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
            fontWeight: '700',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)',
            transition: 'transform 0.2s ease',
          }}
        >
          <Home size={18} /> Back to Home
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
            fontWeight: '700',
            transition: 'all 0.2s ease',
          }}
        >
          <Search size={18} /> Explore Catalog
        </Link>
      </div>
    </div>
  );
}
