import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';

// ── POST /api/coupons/validate ───────────────────────────────────────
// Validate a coupon code (public).
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, reason: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
    }).lean();

    if (!coupon) {
      return NextResponse.json(
        { valid: false, reason: 'Coupon not found' },
        { status: 200 }
      );
    }

    // Check if active
    if (!coupon.isActive) {
      return NextResponse.json(
        { valid: false, reason: 'Coupon is no longer active' },
        { status: 200 }
      );
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, reason: 'Coupon has expired' },
        { status: 200 }
      );
    }

    // Check one-time use
    if (coupon.isOneTimeUse && coupon.usedAt) {
      return NextResponse.json(
        { valid: false, reason: 'Coupon has already been used' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
