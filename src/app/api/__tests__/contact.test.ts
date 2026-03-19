import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';
import { POST } from '../contact/route';

beforeAll(async () => {
  const uri =
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/property-tax-calculator-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/contact', () => {
  it('creates a contact request with valid data', async () => {
    const res = await POST(
      makeRequest({
        name: 'Test User',
        phone: '050-1234567',
        email: 'test@example.com',
        message: 'I need help with my property tax',
        source: 'landing_page',
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.id).toBeDefined();
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(
      makeRequest({
        // missing name, phone, and source — all required
        email: 'test@example.com',
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Validation error');
    expect(data.details).toBeDefined();
  });
});
