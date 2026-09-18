import { POST as cancelOrder } from '../cancel/route.js';

export const dynamic = 'force-dynamic';

export async function POST(req, context) {
  return cancelOrder(req, context);
}
