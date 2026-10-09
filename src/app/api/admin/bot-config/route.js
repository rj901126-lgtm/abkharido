import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

// Default Bot Configuration & Pre-Trained Knowledge Base
let botConfigState = {
  isEnabled: true,
  botName: 'AbKharido Smart Assistant',
  welcomeGreeting: 'Namaste! 🙏 Welcome to AbKharido Support. How can I help you today?',
  supportPhone: '+91 9172600587',
  supportEmail: 'support@abkharido.com',
  workingHours: 'Mon-Sat: 9:00 AM - 9:00 PM IST',
  enableOrderTracking: true,
  enableCouponsChip: true,
  enableReturnsChip: true,
  enableSellerChip: true,
  enableWhatsAppHandoff: true,
  stats: {
    totalConversations: 0,
    resolvedByAI: 0,
    escalatedToHuman: 0,
    avgResponseTime: 'Real-time',
    satisfactionRate: 'N/A'
  },
  customRules: [
    {
      id: 'rule_1',
      triggerKeywords: ['delhi', 'mumbai', 'bangalore', 'kolkata', 'delivery time', 'speed', 'shipping time'],
      category: 'Shipping',
      response: '📦 Standard delivery across India is typically 3-7 business days depending on destination pincode and courier serviceability.',
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'rule_2',
      triggerKeywords: ['warranty', 'guarantee', 'repair', 'brand warranty'],
      category: 'Product Assurance',
      response: '🛡️ Products are backed by seller or manufacturer warranty as specified on the individual product listing. Invoices are provided for all orders.',
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'rule_3',
      triggerKeywords: ['emi', 'credit card emi', 'no cost emi', 'installments'],
      category: 'Payments',
      response: '💳 We support secure online payments via UPI, Credit/Debit cards, Net Banking via Cashfree, and Cash on Delivery (COD) for eligible orders.',
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'rule_4',
      triggerKeywords: ['exchange', 'old phone', 'trade in', 'upgrade'],
      category: 'Offers',
      response: 'ℹ️ We do not currently offer device trade-in or exchange programs. Please check product pages for direct promotional discounts.',
      isActive: true,
      lastUpdated: new Date().toISOString()
    }
  ]
};

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    await connectDB();
    return NextResponse.json(
      { success: true, config: botConfigState },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('Error in GET /api/admin/bot-config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { action, rule, config } = body;

    if (action === 'ADD_RULE' && rule) {
      const newRule = {
        id: `rule_${Date.now()}`,
        triggerKeywords: Array.isArray(rule.triggerKeywords) 
          ? rule.triggerKeywords 
          : String(rule.triggerKeywords || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean),
        category: rule.category || 'General',
        response: rule.response || 'Thank you for your query.',
        isActive: true,
        lastUpdated: new Date().toISOString()
      };
      botConfigState.customRules.unshift(newRule);
      return NextResponse.json({ success: true, message: 'New AI Q&A rule created successfully!', rule: newRule });
    }

    if (action === 'TOGGLE_RULE' && rule?.id) {
      const target = botConfigState.customRules.find(r => r.id === rule.id);
      if (target) {
        target.isActive = !target.isActive;
        target.lastUpdated = new Date().toISOString();
      }
      return NextResponse.json({ success: true, message: 'Rule status updated!' });
    }

    if (action === 'DELETE_RULE' && rule?.id) {
      botConfigState.customRules = botConfigState.customRules.filter(r => r.id !== rule.id);
      return NextResponse.json({ success: true, message: 'Rule deleted successfully!' });
    }

    if (action === 'UPDATE_CONFIG' && config) {
      botConfigState = {
        ...botConfigState,
        ...config,
        stats: botConfigState.stats,
        customRules: botConfigState.customRules
      };
      return NextResponse.json({ success: true, message: 'Bot settings updated successfully!', config: botConfigState });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified.' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/admin/bot-config:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update bot config.' }, { status: 500 });
  }
}
