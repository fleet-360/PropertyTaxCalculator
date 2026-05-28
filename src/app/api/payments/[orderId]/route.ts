import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import {
  findPaymentOrderByOrderId,
  fulfillPaymentOrder,
} from '@/lib/payments';

type RouteParams = { params: Promise<{ orderId: string }> };

// GET /api/payments/[orderId] — poll payment completion after iframe.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { orderId } = await params;
    if (!orderId?.trim()) {
      return NextResponse.json({ error: 'חסר מזהה הזמנה' }, { status: 400 });
    }

    const order = await findPaymentOrderByOrderId(orderId.trim());
    if (!order) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }

    return NextResponse.json({
      status: order.status,
      amountNis: order.amountNis,
      product: order.product,
      calculationIndex: order.calculationIndex,
      demoMode: order.demoMode,
    });
  } catch (error) {
    console.error('GET /api/payments/[orderId]:', error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}

// POST /api/payments/[orderId] — demo checkout when Tranzila is not configured.
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { orderId } = await params;
    const order = await findPaymentOrderByOrderId(orderId?.trim() ?? '');
    if (!order) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }
    if (!order.demoMode) {
      return NextResponse.json(
        { error: 'תשלום דמו אינו זמין להזמנה זו' },
        { status: 403 },
      );
    }
    if (order.status === 'paid') {
      return NextResponse.json({ status: 'paid' });
    }

    await fulfillPaymentOrder(order, `demo-${order.orderId}`);
    return NextResponse.json({ status: 'paid' });
  } catch (error) {
    console.error('POST /api/payments/[orderId]:', error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}
