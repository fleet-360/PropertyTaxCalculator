import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';
import { POST } from '../tax-rates/calculate/route';

beforeAll(async () => {
  const uri =
    process.env.MONGODB_URI_MONGODB_URI ||
    'mongodb://localhost:27017/property-tax-calculator-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/tax-rates/calculate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/tax-rates/calculate', () => {
  it('returns a match when bimonthlyPayment equals calculated amount', async () => {
    // residential > standard > zone א  =>  rate 95 per sqm
    // 80 sqm * 95 = 7600 annual => bimonthly = 7600/6 ≈ 1266.67
    const annual = 80 * 95;
    const bimonthly = Math.round((annual / 6) * 100) / 100;

    const res = await POST(
      makeRequest({
        citySlug: 'mock-city',
        propertyType: 'residential',
        subType: 'standard',
        zone: 'א',
        propertyAreaSqm: 80,
        bimonthlyPayment: bimonthly,
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.outcome).toBe('match');
    expect(data.ratePerSqm).toBe(95);
    expect(data.totalAreaSqm).toBe(80);
  });

  it('detects overpaying when bimonthlyPayment is too high', async () => {
    // residential > standard > zone ב => rate 78.50
    // 80 sqm * 78.50 = 6280 annual => bimonthly = 6280/6 ≈ 1046.67
    const res = await POST(
      makeRequest({
        citySlug: 'mock-city',
        propertyType: 'residential',
        subType: 'standard',
        zone: 'ב',
        propertyAreaSqm: 80,
        bimonthlyPayment: 2000, // much higher than ~1046.67
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.outcome).toBe('overpaying');
    expect(data.savingsBimonthly).toBeGreaterThan(0);
    expect(data.savingsAnnual).toBeGreaterThan(0);
  });

  it('applies exemption discount when selectedExemptionCode is provided', async () => {
    // residential > standard > zone א => rate 95
    // 80 sqm * 95 = 7600 annual
    // senior_25 => 25% discount => 7600 * 0.75 = 5700
    const res = await POST(
      makeRequest({
        citySlug: 'mock-city',
        propertyType: 'residential',
        subType: 'standard',
        zone: 'א',
        propertyAreaSqm: 80,
        bimonthlyPayment: 1000,
        selectedExemptionCode: 'senior_25',
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.appliedExemption).toBeDefined();
    expect(data.appliedExemption.subSectionCode).toBe('senior_25');
    expect(data.appliedExemption.discountPercent).toBe(25);
    expect(data.annualAfterExemption).toBeLessThan(
      data.annualBeforeExemption,
    );
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(
      makeRequest({
        // missing citySlug
        propertyType: 'residential',
        bimonthlyPayment: 500,
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('returns 404 for an unknown city slug', async () => {
    const res = await POST(
      makeRequest({
        citySlug: 'no-such-city',
        propertyType: 'residential',
        subType: 'standard',
        zone: 'א',
        propertyAreaSqm: 80,
        bimonthlyPayment: 500,
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toContain('not found');
  });
});
