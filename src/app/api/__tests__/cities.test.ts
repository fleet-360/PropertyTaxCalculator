import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';
import { GET } from '../cities/route';
import { GET as GET_BY_ID } from '../cities/[id]/route';

beforeAll(async () => {
  const uri =
    process.env.MONGODB_URI_MONGODB_URI ||
    'mongodb://localhost:27017/property-tax-calculator-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

describe('GET /api/cities', () => {
  it('returns an array containing mock-city', async () => {
    const req = new NextRequest('http://localhost/api/cities');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.cities)).toBe(true);

    const mockCity = data.cities.find(
      (c: { slug: string }) => c.slug === 'mock-city',
    );
    expect(mockCity).toBeDefined();
    expect(mockCity.cityNameEn).toBe('Mock City');
    expect(mockCity.year).toBe(2026);
    // Types should be stripped (no rate info, only code/label/subtypes)
    expect(mockCity.types.length).toBeGreaterThan(0);
    const firstType = mockCity.types[0];
    expect(firstType).toHaveProperty('category');
    expect(firstType).toHaveProperty('code');
    expect(firstType).toHaveProperty('label');
    expect(firstType).toHaveProperty('subtypes');
  });
});

describe('GET /api/cities/[id]', () => {
  it('returns a city by slug', async () => {
    const req = new NextRequest('http://localhost/api/cities/mock-city');
    const res = await GET_BY_ID(req, {
      params: Promise.resolve({ id: 'mock-city' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.slug).toBe('mock-city');
    expect(data.cityNameEn).toBe('Mock City');
    // Full detail should include types with zones and rates
    expect(data.types).toBeDefined();
    expect(data.types.length).toBeGreaterThan(0);
    expect(data.types[0].subtypes[0].zones.length).toBeGreaterThan(0);
  });

  it('returns 404 for an unknown slug', async () => {
    const req = new NextRequest(
      'http://localhost/api/cities/nonexistent-city',
    );
    const res = await GET_BY_ID(req, {
      params: Promise.resolve({ id: 'nonexistent-city' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('City not found');
  });
});
