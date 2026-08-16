"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  const [errorId, setErrorId] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Generate unique diagnostic error tracking ID
    const generatedId = error?.digest || `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setErrorId(generatedId);

    const logPayload = {
      errorId: generatedId,
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      digest: error?.digest,
      timestamp: new Date().toISOString(),
      route: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };

    console.error('[AbKharido Global Error Boundary Caught]:', logPayload);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '24px 16px',
      textAlign: 'center',
      fontFamily: 'Inter, sans-serif',
      maxWidth: '680px',
      margin: '0 auto'
    }}>
      <div style={{
        background: '#fee2e2',
        color: '#ef4444',
        padding: '20px',
        borderRadius: '50%',
        marginBottom: '24px',
        display: 'inline-flex'
      }}>
        <AlertTriangle size={56} />
      </div>
      
      <h1 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '12px', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
        Oops! Something went wrong.
      </h1>
      
      <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '480px', marginBottom: '28px', lineHeight: '1.6' }}>
        We encountered an unexpected issue on this page. Our engineering team has been logged for diagnostics.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            padding: '12px 28px',
            borderRadius: '30px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            transition: 'transform 0.2s ease'
          }}
        >
          <RefreshCw size={16} />
          Try Again
        </button>

        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.location.href = '/';
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f1f5f9',
            color: '#334155',
            border: '1px solid #cbd5e1',
            padding: '12px 24px',
            borderRadius: '30px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Return to Home
        </button>
      </div>

      <div style={{ marginTop: '36px', fontSize: '12px', color: '#94a3b8' }}>
        <span>Tracking Error ID: </span>
        <code style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
          {errorId || 'GENERATING...'}
        </code>
      </div>

      {(isDev || showDetails) && error?.message && (
        <div style={{ marginTop: '24px', width: '100%', textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0, marginBottom: showDetails ? '12px' : 0 }}
          >
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showDetails ? 'Hide Diagnostics' : 'Show Technical Error Details (Dev)'}
          </button>
          {showDetails && (
            <pre style={{ fontSize: '12px', color: '#dc2626', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
