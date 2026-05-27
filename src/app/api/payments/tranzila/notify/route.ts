import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import {
  findPaymentOrderByOrderId,
  fulfillPaymentOrder,
} from '@/lib/payments';
import PaymentOrder from '@/lib/models/PaymentOrder';
import {
  getNotifyOrderId,
  getNotifyTransactionId,
  isTranzilaSuccessResponse,
  parseTranzilaNotifyFields,
} from '@/lib/tranzila';

// POST /api/payments/tranzila/notify — Tranzila server-to-server callback.
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const contentType = request.headers.get('content-type') ?? '';
    let fields;
    if (contentType.includes('application/json')) {
      const json = (await request.json()) as Record<string, unknown>;
      fields = Object.fromEntries(
        Object.entries(json).map(([k, v]) => [k, String(v)]),
      );
    } else {
      const form = await request.formData();
      fields = parseTranzilaNotifyFields(form);
    }

    const orderId = getNotifyOrderId(fields);
    if (!orderId) {
      return new NextResponse('MISSING_ORDER', { status: 400 });
    }

    const order = await findPaymentOrderByOrderId(orderId);
    if (!order) {
      return new NextResponse('UNKNOWN_ORDER', { status: 404 });
    }

    if (!isTranzilaSuccessResponse(fields)) {
      order.status = 'failed';
      await order.save();
      return new NextResponse('DECLINED', { status: 200 });
    }

    await fulfillPaymentOrder(order, getNotifyTransactionId(fields));
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('POST /api/payments/tranzila/notify:', error);
    return new NextResponse('ERROR', { status: 500 });
  }
}

// Some Tranzila setups ping notify with GET.
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const fields = parseTranzilaNotifyFields(request.nextUrl.searchParams);
    const orderId = getNotifyOrderId(fields);
    if (!orderId) {
      return new NextResponse('MISSING_ORDER', { status: 400 });
    }
    const order = await findPaymentOrderByOrderId(orderId);
    if (!order) {
      return new NextResponse('UNKNOWN_ORDER', { status: 404 });
    }
    if (!isTranzilaSuccessResponse(fields)) {
      await PaymentOrder.updateOne({ orderId }, { status: 'failed' });
      return new NextResponse('DECLINED', { status: 200 });
    }
    await fulfillPaymentOrder(order, getNotifyTransactionId(fields));
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('GET /api/payments/tranzila/notify:', error);
    return new NextResponse('ERROR', { status: 500 });
  }
}
