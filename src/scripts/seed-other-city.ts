import mongoose from 'mongoose';
import CityTariff from '../lib/models/CityTariff';
import seedData from '../data/other-city-seed.json';

const MONGODB_URI =
  process.env.MONGODB_URI_MONGODB_URI || 'mongodb://localhost:27017/property-tax-calculator-test';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB: ${MONGODB_URI}`);

    await CityTariff.deleteMany({ slug: 'other' });
    console.log('Deleted existing "עיר אחרת" documents');

    await CityTariff.insertMany(seedData);
    console.log('Inserted "עיר אחרת" seed data');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();


