import mongoose from 'mongoose';
import CityTariff from '../lib/models/CityTariff';
import seedData from '../data/mock-city-seed.json';

const MONGODB_URI =
  process.env.MONGODB_URI_MONGODB_URI || 'mongodb://localhost:27017/property-tax-calculator';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB: ${MONGODB_URI}`);

    await CityTariff.deleteMany({ slug: 'mock-city' });
    console.log('Deleted existing mock-city documents');

    await CityTariff.insertMany(seedData);
  
    console.log('Inserted mock-city seed data');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
