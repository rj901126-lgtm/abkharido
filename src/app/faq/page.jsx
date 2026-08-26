import React from 'react';
import InfoPage from '../../views/InfoPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Frequently Asked Questions (FAQ) | AbKharido Support',
  description: 'Find instant answers to questions about order tracking, delivery timelines, 7-day returns, Cash on Delivery (COD), brand warranty, and seller onboarding on AbKharido.',
  alternates: {
    canonical: `${SITE_URL}/faq`
  },
  openGraph: {
    title: 'Frequently Asked Questions (FAQ) | AbKharido Helpdesk',
    description: 'Get 24/7 help on orders, shipping, returns, refunds, and coupons on AbKharido.',
    url: `${SITE_URL}/faq`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website'
  }
};

export default function FAQPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I track my order and get my doorstep delivery PIN on AbKharido?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can track your order live by opening the "My Orders" tab or asking the 24/7 AbKharido AI Assistant Bot. You will receive real-time courier tracking (NimbusPost / BlueDart) and your 4-digit doorstep delivery PIN.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is AbKharido\'s 7-Day Return and Refund Policy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All electronics, smartphones, and fashion products are protected by our 7-Day Doorstep Replacement/Refund guarantee. In case of any defect or size mismatch, our courier will pick up the package from your doorstep and initiate an instant refund within 24-48 hours.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is Cash on Delivery (COD) available on AbKharido?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Cash on Delivery (COD) is available across 29,000+ Indian pincodes for orders up to ₹15,000 with Doorstep OTP verification.'
        }
      },
      {
        '@type': 'Question',
        name: 'How fast is express delivery across India on AbKharido?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We provide Next-Day Priority Air Express delivery in metro zones (Delhi NCR, Mumbai, Bangalore, Hyderabad, Pune, Kolkata) and 2-3 business days across all other Indian districts.'
        }
      },
      {
        '@type': 'Question',
        name: 'How can merchants and manufacturers sell on AbKharido?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Merchants can register for free on the AbKharido Seller Portal (/seller) with 0% commission, bulk Excel product catalog import, and automated daily bank settlements.'
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <InfoPage infoType="faq" />
    </>
  );
}
