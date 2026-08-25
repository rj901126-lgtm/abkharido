import { NextResponse } from 'next/server';
import { getCashfreeConfig } from '../../../../../lib/cashfree.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const config = getCashfreeConfig();

    const maskedSecret = config.secretKey 
      ? '••••••••' + config.secretKey.slice(-4) 
      : '';
    const maskedWebhook = config.webhookSecret 
      ? '••••••••' + config.webhookSecret.slice(-4) 
      : '';

    return NextResponse.json({
      environment: config.env,
      appId: config.appId,
      secretKeyMasked: maskedSecret,
      webhookSecretMasked: maskedWebhook,
      apiVersion: config.apiVersion,
      isConfigured: config.isConfigured,
      codMaxOrderLimit: 15000,
      coinRateRule: '1 AB Coin = ₹1'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
