import { NextResponse } from 'next/server';
import { getCashfreeConfig } from '../../../../../lib/cashfree.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const config = getCashfreeConfig();

    if (!config.appId || !config.secretKey) {
      return NextResponse.json({
        success: false,
        message: 'CASHFREE_APP_ID or CASHFREE_SECRET_KEY is not set in environment.'
      }, { status: 400 });
    }

    // Ping Cashfree API with a benign query (e.g. check a dummy order or ping)
    const response = await fetch(`${config.baseUrl}/orders/test_ping_${Date.now()}`, {
      method: 'GET',
      headers: {
        'x-client-id': config.appId,
        'x-client-secret': config.secretKey,
        'x-api-version': config.apiVersion
      }
    });

    // If 404 (order not found) or 200, authentication succeeded!
    // If 401 / 403, credentials are invalid.
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed. Please verify your App ID and Secret Key for ' + config.env
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully connected to Cashfree ${config.env.toUpperCase()} Gateway!`,
      environment: config.env,
      apiVersion: config.apiVersion,
      appIdMasked: config.appId.slice(0, 4) + '...' + config.appId.slice(-4)
    });

  } catch (error) {
    console.error('[Cashfree Test Connection Error]:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to connect to Cashfree Gateway'
    }, { status: 500 });
  }
}
