import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const MONGODB_URI =
  process.env.MONGODB_URI_MONGODB_URI ||
  'mongodb://localhost:27017/property-tax-calculator-test';

export async function setup() {
  await mongoose.connect(MONGODB_URI);
  console.log(`[global-setup] Connected to ${MONGODB_URI}`);

  // Import CityTariff model after connection is established
  const { default: CityTariff } = await import('../lib/models/CityTariff');

  const seedPath = resolve(__dirname, '../data/mock-city-seed.json');
  const seedData = JSON.parse(readFileSync(seedPath, 'utf-8'));

  await CityTariff.deleteMany({ slug: 'mock-city' });
  await CityTariff.insertMany(seedData);
  console.log('[global-setup] Seeded mock-city data');

  await mongoose.disconnect();
  console.log('[global-setup] Disconnected');
}

export async function teardown() {
  // Nothing to clean up; test DB persists between runs for inspection.
  // Drop the DB here if you prefer a clean slate each time.
}
