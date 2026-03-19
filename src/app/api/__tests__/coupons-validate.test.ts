import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';
import Coupon from '@/lib/models/Coupon';
import { POST } from '../coupons/validate/route';

beforeAll(async () => {
  const uri =
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/property-tax-calculator-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  // Clean up any previous test coupons and seed fresh ones
  await Coupon.deleteMany({
    code: { $in: ['TESTVALID10', 'TESTEXPIRED', 'TESTUSED', 'TESTINACTIVE'] },
  });

  await Coupon.insertMany([
    {
      code: 'TESTVALID10',
      discountType: 'percentage',
      discountValue: 10,
      isOneTimeUse: false,
      isActive: true,
    },
    {
      code: 'TESTEXPIRED',
      discountType: 'fixed',
      discountValue: 50,
      isOneTimeUse: false,
      isActive: true,
      expiresAt: new Date('2020-01-01'),
    },
    {
      code: 'TESTUSED',
      discountType: 'percentage',
      discountValue: 15,
      isOneTimeUse: true,
      isActive: true,
      usedAt: new Date(),
      usedBy: new mongoose.Types.ObjectId(),
    },
    {
      code: 'TESTINACTIVE',
      discountType: 'percentage',
      discountValue: 20,
      isOneTimeUse: false,
      isActive: false,
    },
  ]);
});

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/coupons/validate', () => {
  it('validates a valid active coupon', async () => {
    const res = await POST(makeRequest({ code: 'TESTVALID10' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.discountType).toBe('percentage');
    expect(data.discountValue).toBe(10);
  });

  it('rejects an expired coupon', async () => {
    const res = await POST(makeRequest({ code: 'TESTEXPIRED' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.reason).toContain('expired');
  });

  it('rejects a one-time-use coupon that was already used', async () => {
    const res = await POST(makeRequest({ code: 'TESTUSED' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.reason).toContain('already been used');
  });

  it('returns valid=false for a nonexistent coupon', async () => {
    const res = await POST(makeRequest({ code: 'DOESNOTEXIST999' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.reason).toContain('not found');
  });
});
