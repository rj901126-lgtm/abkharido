"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, Trash2, Home } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  const [errorId, setErrorId] = useState('');
  const [copied, setCopied] = useState(false);

  const errorMessage = error?.message || (typeof error === 'string' ? error : 'Application render exception');
  const errorDigest = error?.digest || '';
  const errorStack = error?.stack || '';

  useEffect(() => {
    // Generate unique diagnostic error tracking ID
    const generatedId = error?.digest || `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setErrorId(generatedId);

    const logPayload = {
      errorId: generatedId,
      message: errorMessage,
      stack: errorStack,
      digest: errorDigest,
      timestamp: new Date().toISOString(),
      route: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };

    console.error('[AbKharido Global Error Boundary Caught]:', logPayload);
  }, [error, errorMessage, errorDigest, errorStack]);

  const handleCopyReport = () => {
    const report = `AbKharido Error Report:\nID: ${errorId}\nMessage: ${errorMessage}\nDigest: ${errorDigest}\nURL: ${typeof window !== 'undefined' ? window.location.href : ''}\nStack:\n${errorStack}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(report).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleClearCacheAndReload = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/?refresh=' + Date.now();
      }
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      padding: '24px 16px',
      textAlign: 'center',
      fontFamily: "'Outfit', sans-serif",
      maxWidth: '680px',
      margin: '0 auto'
    }}>
      <div style={{
        background: '#fee2e2',
        color: '#ef4444',
        padding: '18px',
        borderRadius: '50%',
        marginBottom: '20px',
        display: 'inline-flex',
        boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)'
      }}>
        <AlertTriangle size={48} />
      </div>
      
      <h1 style={{ fontSize: '24px', color: '#0f172a', marginBottom: '8px', fontWeight: '900', letterSpacing: '-0.3px' }}>
        Oops! Screen Load Error
      </h1>
      
      <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '480px', marginBottom: '22px', lineHeight: '1.5' }}>
        A temporary display issue occurred. You can easily fix it using the buttons below:
      </p>

      {/* Main Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => reset()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            padding: '11px 22px',
            borderRadius: '99px',
            fontSize: '14px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)'
          }}
        >
          <RefreshCw size={15} />
          Try Again
        </button>

        <button
          onClick={handleClearCacheAndReload}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ecfdf5',
            color: '#059669',
            border: '1.5px solid #a7f3d0',
            padding: '11px 20px',
            borderRadius: '99px',
            fontSize: '14px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)'
          }}
        >
          <Trash2 size={15} />
          Clear Cache & Reload
        </button>

        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.location.href = '/';
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f1f5f9',
            color: '#334155',
            border: '1px solid #cbd5e1',
            padding: '11px 20px',
            borderRadius: '99px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          <Home size={15} />
          Home
        </button>
      </div>

      {/* Visible Mobile Diagnostic Info Box */}
      <div style={{
        marginTop: '16px',
        width: '100%',
        textAlign: 'left',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
            Diagnostic Error Info
          </span>
          <button
            onClick={handleCopyReport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: copied ? '#ecfdf5' : '#ffffff',
              color: copied ? '#059669' : '#4f46e5',
              border: `1px solid ${copied ? '#a7f3d0' : '#c7d2fe'}`,
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy Error Text'}
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700', wordBreak: 'break-word', fontFamily: 'monospace', marginBottom: errorDigest ? '6px' : 0 }}>
          {errorMessage}
        </div>

        {errorDigest && (
          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
            Digest: <code>{errorDigest}</code>
          </div>
        )}

        {errorStack && (
          <details style={{ marginTop: '10px' }}>
            <summary style={{ fontSize: '11px', color: '#4f46e5', cursor: 'pointer', fontWeight: '700' }}>View Call Stack</summary>
            <pre style={{ fontSize: '10.5px', color: '#64748b', overflowX: 'auto', marginTop: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {errorStack}
            </pre>
          </details>
        )}
      </div>

    </div>
  );
}
