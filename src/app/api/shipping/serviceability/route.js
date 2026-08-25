import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get('pincode') || '401404';

    const cleanPin = pincode.replace(/\D/g, '');
    const isServiceable = cleanPin.length === 6;

    const courier = cleanPin.startsWith('40') ? 'BlueDart Express Air (Local Hub)' : 'Delhivery Air Direct';
    const estimatedDays = cleanPin.startsWith('40') ? '1-2' : '2-4';

    return NextResponse.json({
      serviceable: isServiceable,
      courier,
      estimatedDays,
      city: cleanPin.startsWith('40') ? 'Palghar / Thane District' : 'National Transit Hub',
      codAvailable: true,
      prepaidDiscountActive: true
    });
  } catch (error) {
    return NextResponse.json({
      serviceable: true,
      courier: 'BlueDart Air',
      estimatedDays: '2-3',
      codAvailable: true
    });
  }
}
