import React from 'react';
import Link from 'next/link';
import { BLOG_POSTS } from '../../data/blogPosts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Shopping Guides & Buying Advice | AbKharido Blog',
  metadataBase: new URL(SITE_URL),
  description: 'Expert buying guides, product comparisons, and online shopping tips for India. Best smartwatches, earbuds, mobiles, and more — researched and reviewed by AbKharido editorial team.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'AbKharido Blog — Best Buying Guides & Shopping Tips India 2026',
    description: 'In-depth reviews, comparisons, and shopping advice for Indian consumers. Smartwatches, earbuds, mobiles, fashion, and more.',
    url: `${SITE_URL}/blog`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${SITE_URL}/logo.jpg`, width: 1200, height: 630, alt: 'AbKharido Blog' }]
  }
};

const categoryColors = {
  'Buying Guide': '#4f46e5',
  'Shopping Guide': '#0891b2',
  'Help Guide': '#059669',
  'Seller Guide': '#d97706'
};

export default function BlogPage() {
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AbKharido Shopping Guides & Buying Advice',
    url: `${SITE_URL}/blog`,
    description: 'Expert buying guides and product comparisons for Indian shoppers',
    publisher: { '@type': 'Organization', name: 'AbKharido', logo: `${SITE_URL}/logo.jpg` },
    hasPart: BLOG_POSTS.map(post => ({
      '@type': 'Article',
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: { '@type': 'Organization', name: post.author }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {/* Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: 48, padding: '32px 16px' }}>
          <div style={{ display: 'inline-block', background: '#eef2ff', color: '#4f46e5', borderRadius: 99, padding: '6px 16px', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            📚 AbKharido Expert Guides
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 800, color: '#111827', margin: '0 0 12px', lineHeight: 1.2 }}>
            Shopping Guides & Buying Advice
          </h1>
          <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Expert product comparisons, honest reviews, and step-by-step shopping guides — researched by the AbKharido team for Indian consumers.
          </p>
        </div>

        {/* Article Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
          {BLOG_POSTS.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <article
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,70,229,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.05)';
                }}
              >
                {/* Cover Image */}
                <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: '#f3f4f6' }}>
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div style={{
                    position: 'absolute', top: 12, left: 12,
                    background: categoryColors[post.category] || '#4f46e5',
                    color: '#fff', borderRadius: 99, padding: '4px 10px',
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {post.category}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 10px', lineHeight: 1.4 }}>
                    {post.title}
                  </h2>
                  <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.6, flex: 1 }}>
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#9ca3af', marginTop: 'auto' }}>
                    <span>✍️ {post.author.replace('AbKharido ', '')}</span>
                    <span>•</span>
                    <span>⏱️ {post.readTime}</span>
                    <span>•</span>
                    <span>📅 {new Date(post.updatedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  </div>

                  {/* CTA */}
                  <div style={{ marginTop: 16, padding: '10px 16px', background: '#eef2ff', borderRadius: 8, color: '#4f46e5', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                    Read Full Guide →
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: 56, padding: '40px 24px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: 20, color: '#fff' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Ready to Shop?</h2>
          <p style={{ fontSize: 16, opacity: 0.85, margin: '0 0 24px' }}>
            Free delivery · 7-day returns · Cash on Delivery available across India
          </p>
          <Link
            href="/catalog"
            style={{
              display: 'inline-block', background: '#fff', color: '#4f46e5',
              borderRadius: 99, padding: '12px 32px', fontWeight: 800,
              fontSize: 15, textDecoration: 'none'
            }}
          >
            Browse All Products →
          </Link>
        </div>
      </div>
    </>
  );
}
