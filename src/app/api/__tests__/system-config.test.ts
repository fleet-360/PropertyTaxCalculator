import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';
import { GET, PUT } from '../system-config/route';

beforeAll(async () => {
  const uri =
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/property-tax-calculator-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

describe('GET /api/system-config', () => {
  it('returns system config with default values', async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    // Singleton pattern: always returns a config document
    expect(data).toHaveProperty('paymentEnabled');
    expect(data).toHaveProperty('systemEnabled');
    expect(data).toHaveProperty('calculatorPrice');
    expect(data).toHaveProperty('appealPrice');
    expect(typeof data.paymentEnabled).toBe('boolean');
    expect(typeof data.calculatorPrice).toBe('number');
  });
});

describe('PUT /api/system-config', () => {
  it('returns 401 when no auth cookie is provided', async () => {
    const req = new NextRequest('http://localhost/api/system-config', {
      method: 'PUT',
      body: JSON.stringify({ calculatorPrice: 50 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });
});
