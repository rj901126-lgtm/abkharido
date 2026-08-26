import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';

export const dynamic = 'force-dynamic';

// Default Bot Configuration & Pre-Trained Knowledge Base
let botConfigState = {
  isEnabled: true,
  botName: 'AbKharido Smart Assistant',
  welcomeGreeting: 'Namaste! 🙏 Welcome to AbKharido 24/7 Smart Support. How can I help you today?',
  supportPhone: '+91 9172600587',
  supportEmail: 'support@abkharido.com',
  workingHours: '24x7 Priority Desk',
  enableOrderTracking: true,
  enableCouponsChip: true,
  enableReturnsChip: true,
  enableSellerChip: true,
  enableWhatsAppHandoff: true,
  stats: {
    totalConversations: 1428,
    resolvedByAI: 1276,
    escalatedToHuman: 152,
    avgResponseTime: '0.4s',
    satisfactionRate: '98.2%'
  },
  customRules: [
    {
      id: 'rule_1',
      triggerKeywords: ['delhi', 'mumbai', 'bangalore', 'kolkata', 'delivery time', 'speed'],
      category: 'Shipping',
      response: '🚀 We provide **Next-Day Air Priority Delivery** to all major metros (Delhi NCR, Mumbai, Bangalore, Pune, Hyderabad, Chennai, Kolkata) and 2-3 business days across all other Indian pin codes.',
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'rule_2',
      triggerKeywords: ['warranty', 'guarantee', 'repair', 'brand warranty'],
      category: 'Product Assurance',
      response: '🛡️ All electronics and appliances on AbKharido come with **100% Original Brand Manufacturer Warranty (1-2 Years)**. Invoices are GST-compliant and honored at all official brand service centers nationwide.',
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'rule_3',
      triggerKeywords: ['emi', 'credit card emi', 'no cost emi', 'installments'],
      category: 'Payments',
      response: '💳 **No-Cost & Low-Cost EMI** is available on all orders above ₹3,000 using major Credit Cards (HDFC, ICICI, SBI, Axis, Kotak, OneCard) and Cardless Bajaj Finserv EMI.',
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'rule_4',
      triggerKeywords: ['exchange', 'old phone', 'trade in', 'upgrade'],
      category: 'Offers',
      response: '🔄 You can trade in your existing smartphone or gadget for up to **₹12,000 instant exchange bonus** on flagship devices during checkout.',
      isActive: true,
      lastUpdated: new Date().toISOString()
    }
  ]
};

export async function GET(req) {
  try {
    await connectDB();
    return NextResponse.json({
      success: true,
      config: botConfigState
    });
  } catch (error) {
    console.error('Error in GET /api/admin/bot-config:', error);
    return NextResponse.json({ success: true, config: botConfigState });
  }
}

export async function POST(req) {
  try {
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
