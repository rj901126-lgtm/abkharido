import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPost, BLOG_POSTS } from '../../../data/blogPosts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

// Pre-generate all blog post pages at build time
export async function generateStaticParams() {
  return BLOG_POSTS.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    metadataBase: new URL(SITE_URL),
    authors: [{ name: post.author }],
    keywords: post.tags,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: 'AbKharido',
      locale: 'en_IN',
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      section: post.category,
      tags: post.tags,
      images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle,
      description: post.metaDescription,
      images: [post.coverImage]
    }
  };
}

// Minimal Markdown to HTML renderer (no external deps needed)
function renderMarkdown(md) {
  return md
    // Headers
    .replace(/^### (.*$)/gim, '<h3 style="font-size:18px;font-weight:700;color:#111827;margin:28px 0 10px">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size:22px;font-weight:800;color:#111827;margin:36px 0 14px;padding-top:12px;border-top:2px solid #f3f4f6">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size:28px;font-weight:800;color:#111827;margin:0 0 20px">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.*?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;font-family:monospace">$1</code>')
    // Table rows
    .replace(/^\|(.+)\|$/gim, (m, cells) => {
      const tds = cells.split('|').map(c => c.trim()).filter(Boolean);
      if (tds.every(c => /^[-:]+$/.test(c))) return ''; // separator row
      return `<tr>${tds.map(c => `<td style="padding:8px 12px;border:1px solid #e5e7eb">${c}</td>`).join('')}</tr>`;
    })
    // Wrap consecutive tr in table
    .replace(/(<tr>[\s\S]*?<\/tr>)+/g, m => `<div style="overflow-x:auto;margin:16px 0"><table style="border-collapse:collapse;width:100%;font-size:14px">${m}</table></div>`)
    // Horizontal rule
    .replace(/^---$/gim, '<hr style="border:none;border-top:2px solid #f3f4f6;margin:32px 0">')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#4f46e5;font-weight:600;text-decoration:underline">$1</a>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gim, '<li style="margin:4px 0">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, m => m.includes('<ul') ? m : m)
    // Numbered lists
    .replace(/^\d+\. (.+)$/gim, '<li style="margin:6px 0">$1</li>')
    // Paragraphs (lines not starting with html tags)
    .replace(/^(?!<[h|l|t|d|u|o]|---)(.*\S.*)$/gim, '<p style="font-size:16px;line-height:1.8;color:#374151;margin:12px 0">$1</p>')
    // Emojis in headings — keep as is
    .replace(/<\/p>\n<p[^>]*>/g, '</p><p style="font-size:16px;line-height:1.8;color:#374151;margin:12px 0">');
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    image: post.coverImage,
    author: { '@type': 'Organization', name: post.author, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'AbKharido',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.jpg` }
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
    keywords: post.tags.join(', '),
    articleSection: post.category,
    inLanguage: 'en-IN',
    about: {
      '@type': 'Thing',
      name: post.category
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` }
    ]
  };

  const htmlContent = renderMarkdown(post.content);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 64px' }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', gap: 6, fontSize: 13, color: '#9ca3af', marginBottom: 24, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#4f46e5', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/blog" style={{ color: '#4f46e5', textDecoration: 'none' }}>Blog</Link>
          <span>›</span>
          <span style={{ color: '#6b7280' }}>{post.category}</span>
        </nav>

        {/* Category Badge */}
        <div style={{ display: 'inline-block', background: '#eef2ff', color: '#4f46e5', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {post.category}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(22px, 5vw, 34px)', fontWeight: 800, color: '#111827', margin: '0 0 16px', lineHeight: 1.3 }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: '#6b7280', marginBottom: 28, padding: '16px 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
          <span>✍️ {post.author}</span>
          <span>⏱️ {post.readTime}</span>
          <span>📅 Updated: {new Date(post.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        {/* Cover Image */}
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 36, aspectRatio: '16/9' }}>
          <img
            src={post.coverImage}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="eager"
          />
        </div>

        {/* Excerpt / Lead */}
        <div style={{ background: '#f8fafc', borderLeft: '4px solid #4f46e5', padding: '16px 20px', borderRadius: '0 12px 12px 0', marginBottom: 32, fontSize: 16, color: '#374151', lineHeight: 1.7, fontStyle: 'italic' }}>
          {post.excerpt}
        </div>

        {/* Article Content */}
        <div
          style={{ fontSize: 16, lineHeight: 1.8, color: '#374151' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Tags */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '2px solid #f3f4f6' }}>
          <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Tags</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {post.tags.map(tag => (
              <span key={tag} style={{ background: '#f3f4f6', color: '#374151', borderRadius: 99, padding: '4px 12px', fontSize: 13 }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 48, padding: '32px 24px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: 20, color: '#fff', textAlign: 'center' }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Shop What You Just Read About</h3>
          <p style={{ fontSize: 15, opacity: 0.85, margin: '0 0 20px' }}>Free delivery · 7-day returns · Cash on Delivery · 100% genuine products</p>
          <Link
            href="/catalog"
            style={{ display: 'inline-block', background: '#fff', color: '#4f46e5', borderRadius: 99, padding: '12px 28px', fontWeight: 800, fontSize: 15, textDecoration: 'none' }}
          >
            Browse Products →
          </Link>
        </div>

        {/* More Articles */}
        <div style={{ marginTop: 48 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 24 }}>More Guides</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {BLOG_POSTS.filter(p => p.slug !== slug).slice(0, 3).map(p => (
              <Link key={p.slug} href={`/blog/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                  <img src={p.coverImage} alt={p.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} loading="lazy" />
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.4 }}>{p.title}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '6px 0 0' }}>{p.readTime}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
