'use client';
import React from 'react';
import Link from 'next/link';

/**
 * SEOBreadcrumb — Renders a visible, keyboard-accessible breadcrumb trail.
 * MUST match the BreadcrumbList JSON-LD schema injected by the server component.
 *
 * Props:
 *   items: Array<{ name: string, href?: string }>
 *   The last item should NOT have an href (it's the current page).
 */
export default function SEOBreadcrumb({ items = [] }) {
  if (!items || items.length < 2) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
        fontSize: 13,
        color: '#6b7280',
        padding: '10px 0',
        lineHeight: 1.5,
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {isLast ? (
              <span
                aria-current="page"
                style={{
                  color: '#374151',
                  fontWeight: 600,
                  maxWidth: 220,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                }}
                title={item.name}
              >
                {item.name}
              </span>
            ) : (
              <Link
                href={item.href || '/'}
                style={{
                  color: '#4f46e5',
                  textDecoration: 'none',
                  fontWeight: 500,
                  flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                {item.name}
              </Link>
            )}
            {!isLast && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ flexShrink: 0, color: '#d1d5db' }}
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
