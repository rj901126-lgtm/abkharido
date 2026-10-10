"use client";

import React, { useEffect, useState } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  const [errorId, setErrorId] = useState('');

  useEffect(() => {
    const generatedId = error?.digest || `ERR-500-${Date.now().toString(36).toUpperCase()}`;
    setErrorId(generatedId);
    console.error('[AbKharido Global 500 Exception]:', error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Server Error (500) | AbKharido</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        backgroundColor: '#0f172a',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '520px',
          width: '90%',
          padding: '40px 32px',
          backgroundColor: '#1e293b',
          borderRadius: '24px',
          border: '1px solid #334155',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto'
          }}>
            <AlertOctagon size={40} />
          </div>

          <span style={{
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '4px 12px',
            borderRadius: '100px'
          }}>
            Server Error (500)
          </span>

          <h1 style={{
            fontSize: '24px',
            fontWeight: '900',
            margin: '16px 0 8px 0',
            color: '#f8fafc'
          }}>
            Something went wrong
          </h1>

          <p style={{
            fontSize: '14px',
            color: '#94a3b8',
            lineHeight: 1.6,
            margin: '0 0 24px 0'
          }}>
            Our system encountered an unexpected server exception while processing this page. Our engineering team has been notified.
          </p>

          {errorId && (
            <div style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#64748b',
              backgroundColor: '#0f172a',
              padding: '8px 12px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #1e293b'
            }}>
              Reference ID: {errorId}
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={() => reset ? reset() : window.location.reload()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              <RefreshCw size={16} /> Try Again
            </button>

            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1px solid #475569',
                backgroundColor: 'transparent',
                color: '#f8fafc',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none',
                minHeight: '44px'
              }}
            >
              <Home size={16} /> Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
