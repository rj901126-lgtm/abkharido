"use client";

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageToggle({ style = {} }) {
  const { lang, changeLanguage } = useLanguage();

  return (
    <div 
      className="language-toggle-wrapper"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '100px',
        padding: '3px 4px',
        gap: '2px',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: '#94a3b8' }}>
        <Globe size={13} />
      </div>
      <button
        type="button"
        onClick={() => changeLanguage('en')}
        style={{
          background: lang === 'en' ? '#4f46e5' : 'transparent',
          color: lang === 'en' ? '#ffffff' : '#94a3b8',
          border: 'none',
          borderRadius: '100px',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: lang === 'en' ? '800' : '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => changeLanguage('hi')}
        style={{
          background: lang === 'hi' ? '#4f46e5' : 'transparent',
          color: lang === 'hi' ? '#ffffff' : '#94a3b8',
          border: 'none',
          borderRadius: '100px',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: lang === 'hi' ? '800' : '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        हिन्दी
      </button>
    </div>
  );
}
