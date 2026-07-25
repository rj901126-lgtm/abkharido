import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const dummyOrderId = 'ORDER_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    return NextResponse.json({
      success: true,
      orderId: dummyOrderId,
      payment_session_id: 'session_' + dummyOrderId
    });
  } catch (error) {
    console.error("Payment session init error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
