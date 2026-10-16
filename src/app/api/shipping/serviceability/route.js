import { NextResponse } from 'next/server';
import { lookupPincode } from '../../../../utils/pincodeData.js';

export const dynamic = 'force-dynamic';

async function handleServiceability(req) {
  try {
    let pinStr = '';

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      pinStr = String(body.deliveryPincode || body.pincode || '').trim();
    } else {
      const { searchParams } = new URL(req.url);
      pinStr = String(searchParams.get('deliveryPincode') || searchParams.get('pincode') || '').trim();
    }

    const cleanPin = pinStr.replace(/\D/g, '');
    const isValidPin = /^[1-9][0-9]{5}$/.test(cleanPin);

    if (!isValidPin) {
      return NextResponse.json(
        {
          serviceable: false,
          codAvailable: false,
          deliveryEstimate: 'Estimate unavailable',
          estimatedDays: 'Unavailable',
          courier: null,
          message: 'Invalid Indian PIN code. Must be a 6-digit postal code.'
        },
        { status: 400 }
      );
    }

    const hasCourierApi = Boolean(
      process.env.NIMBUSPOST_TOKEN ||
        process.env.NIMBUSPOST_API_KEY ||
        process.env.NIMBUS_API_KEY
    );

    const pinInfo = lookupPincode(cleanPin);
    const isMetroOrFastZone = Boolean(
      cleanPin.startsWith('400') ||
        cleanPin.startsWith('401') ||
        cleanPin.startsWith('410') ||
        cleanPin.startsWith('411') ||
        cleanPin.startsWith('421') ||
        cleanPin.startsWith('110') ||
        cleanPin.startsWith('560') ||
        cleanPin.startsWith('500') ||
        cleanPin.startsWith('380') ||
        cleanPin.startsWith('395')
    );

    const estimatedDays = isMetroOrFastZone ? '2-3' : '3-5';
    const courierName = hasCourierApi
      ? 'NimbusPost Express Network'
      : cleanPin.startsWith('4')
      ? 'BlueDart / Delhivery Express'
      : 'Delhivery National Network';
    const deliveryEstimate =
      pinInfo?.formattedEstimate || `${estimatedDays} business days via ${courierName}`;

    return NextResponse.json(
      {
        status: 1,
        serviceable: true,
        codAvailable: pinInfo ? Boolean(pinInfo.isCodAvailable) : true,
        codMaxCap: 15000,
        freeShippingThreshold: 499,
        pincode: cleanPin,
        city: pinInfo?.city || null,
        state: pinInfo?.state || null,
        courier: courierName,
        estimatedDays: `${estimatedDays} Business Days`,
        deliveryEstimate,
        courierEstimateAvailable: true,
        data: {
          available_courier_companies: [
            {
              courier_name: courierName,
              estimated_delivery_days: estimatedDays
            }
          ]
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Shipping Serviceability Error]:', error);
    return NextResponse.json(
      {
        serviceable: false,
        codAvailable: false,
        deliveryEstimate: 'Estimate unavailable',
        error: 'Failed to verify shipping serviceability'
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  return handleServiceability(req);
}

export async function GET(req) {
  return handleServiceability(req);
}
