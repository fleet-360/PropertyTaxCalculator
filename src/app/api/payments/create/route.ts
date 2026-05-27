import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { createPaymentSession, type PaymentProduct } from '@/lib/payments';

const PRODUCTS: PaymentProduct[] = ['calculator', 'appeal'];

// POST /api/payments/create — start Tranzila (or demo) payment for a lead.
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { leadId, product, couponCode } = body as {
      leadId?: string;
      product?: string;
      couponCode?: string;
    };

    if (!leadId || !product || !PRODUCTS.includes(product as PaymentProduct)) {
      return NextResponse.json(
        { error: 'נתוני בקשה לא תקינים' },
        { status: 400 },
      );
    }

    const result = await createPaymentSession({
      leadId,
      product: product as PaymentProduct,
      couponCode: typeof couponCode === 'string' ? couponCode : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      orderId: result.orderId,
      amountNis: result.amountNis,
      mode: result.mode,
      status: result.status,
      paymentUrl: result.paymentUrl,
    });
  } catch (error) {
    console.error('POST /api/payments/create:', error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}
