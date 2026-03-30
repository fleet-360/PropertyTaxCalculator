import mongoose from 'mongoose';
import CityTariff from '../lib/models/CityTariff';
import citiesData from '../data/cities-seed.json';

const MONGODB_URI =
  process.env.MONGODB_URI_MONGODB_URI || 'mongodb://localhost:27017/property-tax-calculator-test';

async function main() {
  const targetSlug = process.argv[2]; // optional: seed only a specific city

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB: ${MONGODB_URI}`);

    const citiesToSeed = targetSlug
      ? citiesData.filter((c: any) => c.slug === targetSlug)
      : citiesData;

    if (citiesToSeed.length === 0) {
      console.error(`City with slug "${targetSlug}" not found in seed data.`);
      console.log('Available slugs:', citiesData.map((c: any) => c.slug).join(', '));
      process.exit(1);
    }

    for (const city of citiesToSeed) {
      const c = city as any;
      const deleted = await CityTariff.deleteMany({ slug: c.slug, year: c.year });
      console.log(`Deleted ${deleted.deletedCount} existing document(s) for ${c.cityName} (${c.slug})`);
    }

    const result = await CityTariff.insertMany(citiesToSeed);
    console.log(`\nInserted ${result.length} city tariff(s):`);
    result.forEach((doc: any) => {
      console.log(`  - ${doc.cityName} (${doc.slug}) | ${doc.types.length} types, ${doc.availableZones.length} zones, ${doc.exemptions.length} exemptions`);
    });
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main();
