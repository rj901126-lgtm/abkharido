import { NextResponse } from 'next/server';

// Mock CMS promotions / announcements
export async function GET() {
  return NextResponse.json({
    banners: [
      {
        title: 'Premium Sound. Zero Distractions.',
        desc: 'Experience our best noise-cancelling headphones yet. Up to 40 hours of battery life.',
        bg: 'url(https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1200&auto=format&fit=crop) center/cover no-repeat',
        tag: 'AUDIO WEEK DEAL',
        cat: 'electronics'
      },
      {
        title: 'The New Standard in Fashion',
        desc: 'Elevate your wardrobe with our latest collection. Uncompromising quality at unbeatable prices.',
        bg: 'url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop) center/cover no-repeat',
        tag: 'SUMMER COLLECTION',
        cat: 'fashion'
      }
    ],
    announcement: {
      show: true,
      text: '🎉 Free Delivery on orders above ₹499 | Use code FIRSTBUY for 10% off!',
      link: ''
    },
    dealsTimer: null
  });
}
