import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';
import { POST } from '../leads/route';

beforeAll(async () => {
  const uri =
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/property-tax-calculator-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/leads', () => {
  it('creates a lead with valid data', async () => {
    const res = await POST(
      makeRequest({
        fullName: 'Test User',
        phone: '050-1234567-' + Date.now(),
        email: 'test@example.com',
        message: 'I need help with my property tax',
        source: 'contact_form',
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.lead).toBeDefined();
    expect(data.lead.fullName).toBe('Test User');
    expect(data.lead.source).toBe('contact_form');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(
      makeRequest({
        email: 'test@example.com',
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Validation error');
  });

  it('upserts when the same phone is used', async () => {
    const phone = '050-upsert-' + Date.now();

    // First creation
    const res1 = await POST(
      makeRequest({
        fullName: 'First Name',
        phone,
        source: 'calculator',
        calculation: { abandonmentStage: 'data_entry', citySlug: 'test-city' },
      }),
    );
    const data1 = await res1.json();
    expect(res1.status).toBe(201);
    expect(data1.calculationIndex).toBe(0);

    // Second call with same phone - should upsert
    const res2 = await POST(
      makeRequest({
        fullName: 'Updated Name',
        phone,
        source: 'calculator',
        calculation: { abandonmentStage: 'data_entry', citySlug: 'other-city' },
      }),
    );
    const data2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(data2.isExisting).toBe(true);
    expect(data2.lead.fullName).toBe('Updated Name');
    expect(data2.lead.calculations).toHaveLength(2);
    expect(data2.calculationIndex).toBe(1);
  });
});
