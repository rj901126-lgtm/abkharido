"use client";

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('AbKharido Global Error Boundary Caught:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: '#fee2e2',
        color: '#ef4444',
        padding: '20px',
        borderRadius: '50%',
        marginBottom: '24px'
      }}>
        <AlertTriangle size={64} />
      </div>
      
      <h1 style={{ fontSize: '32px', color: '#1e293b', marginBottom: '16px', fontWeight: '800' }}>
        Oops! Something went wrong.
      </h1>
      
      <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '500px', marginBottom: '32px', lineHeight: '1.6' }}>
        We encountered an unexpected error on our end. Our engineering team has been notified. Please try refreshing the page.
      </p>

      <button
        onClick={() => reset()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          padding: '14px 28px',
          borderRadius: '30px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <RefreshCw size={18} />
        Try Again
      </button>

      <p style={{ marginTop: '40px', fontSize: '13px', color: '#94a3b8' }}>
        Error ID: {error.digest || 'Unknown'}
      </p>
    </div>
  );
}
