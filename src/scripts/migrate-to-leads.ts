/**
 * Migration script: Migrate customers and contactrequests → leads
 *
 * Run with: npx tsx src/scripts/migrate-to-leads.ts
 *
 * This script:
 * 1. Reads all documents from the `customers` collection
 * 2. Reads all documents from the `contactrequests` collection
 * 3. Transforms and inserts them into the `leads` collection
 * 4. Handles phone uniqueness conflicts by merging data
 */

import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI_MONGODB_URI || 'mongodb://localhost:27017/property-tax-calculator';

const SOURCE_MAP: Record<string, string> = {
  calculator_business: 'calculator',
  landing_page: 'contact_form',
  appeal: 'calculator',
};

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;

  const customersCol = db.collection('customers');
  const contactsCol = db.collection('contactrequests');
  const leadsCol = db.collection('leads');

  // Track phones to handle uniqueness
  const phoneMap = new Map<string, any>();

  // ── Migrate customers ──────────────────────────────────────────────
  const customers = await customersCol.find({}).toArray();
  console.log(`Found ${customers.length} customers to migrate`);

  for (const c of customers) {
    const phone = (c.phone || `no-phone-${c._id}`).trim();

    const calculation = {
      abandonmentStage: 'completed',
      propertyType: c.propertyType,
      citySlug: c.citySlug,
      propertyNumber: c.propertyNumber,
      propertyId: c.propertyId,
      address: c.address,
      blockParcel: c.blockParcel,
      propertyArea: c.propertyArea,
      coveredBalconyArea: c.coveredBalconyArea,
      storageArea: c.storageArea,
      parkingArea: c.parkingArea,
      classificationCode: c.classificationCode,
      zone: c.zone,
      bimonthlyPayment: c.bimonthlyPayment,
      designations: c.designations,
      calculationStatus: c.status, // old customer status → calculation status
      calculationResult: c.calculationResult,
      selectedExemptions: c.selectedExemptions,
      householdSize: c.householdSize,
      childrenCount: c.childrenCount,
      errorReport: c.errorReport,
      createdAt: c.createdAt || new Date(),
    };

    if (phoneMap.has(phone)) {
      // Merge: add calculation to existing lead
      const existing = phoneMap.get(phone);
      existing.calculations.push(calculation);
    } else {
      phoneMap.set(phone, {
        fullName: c.fullName,
        phone,
        email: c.email,
        idNumber: c.idNumber,
        source: 'calculator',
        status: 'closed',
        paymentStatus: c.paymentStatus || 'none',
        paymentTransactions: c.paymentTransactions,
        appealDocument: c.appealDocument,
        uploadedDocuments: c.uploadedDocuments,
        consentTimestamp: c.consentTimestamp,
        calculations: [calculation],
        createdAt: c.createdAt || new Date(),
        updatedAt: c.updatedAt || new Date(),
        _migratedFrom: { type: 'customer', originalId: c._id },
      });
    }
  }

  // ── Migrate contact requests ────────────────────────────────────────
  const contacts = await contactsCol.find({}).toArray();
  console.log(`Found ${contacts.length} contact requests to migrate`);

  for (const cr of contacts) {
    const phone = (cr.phone || `no-phone-${cr._id}`).trim();
    const source = SOURCE_MAP[cr.source] || 'contact_form';

    if (phoneMap.has(phone)) {
      // Merge: update message if missing, keep existing lead data
      const existing = phoneMap.get(phone);
      if (!existing.message && cr.message) {
        existing.message = cr.message;
      }
      if (!existing.email && cr.email) {
        existing.email = cr.email;
      }
    } else {
      phoneMap.set(phone, {
        fullName: cr.name,
        phone,
        email: cr.email,
        source,
        status: cr.status || 'new',
        message: cr.message,
        paymentStatus: 'none',
        calculations: [],
        createdAt: cr.createdAt || new Date(),
        updatedAt: cr.updatedAt || new Date(),
        _migratedFrom: { type: 'contact_request', originalId: cr._id },
      });
    }
  }

  // ── Insert all leads ────────────────────────────────────────────────
  const leadsToInsert = Array.from(phoneMap.values());
  console.log(`Inserting ${leadsToInsert.length} leads...`);

  if (leadsToInsert.length > 0) {
    const result = await leadsCol.insertMany(leadsToInsert);
    console.log(`Inserted ${result.insertedCount} leads`);
  }

  // ── Create indexes ──────────────────────────────────────────────────
  await leadsCol.createIndex({ phone: 1 }, { unique: true });
  await leadsCol.createIndex({ status: 1 });
  await leadsCol.createIndex({ source: 1 });
  await leadsCol.createIndex({ createdAt: -1 });
  await leadsCol.createIndex({ 'calculations.abandonmentStage': 1 });
  await leadsCol.createIndex({ 'calculations.citySlug': 1 });
  console.log('Indexes created');

  // ── Summary ─────────────────────────────────────────────────────────
  const leadsCount = await leadsCol.countDocuments();
  console.log('\n=== Migration Summary ===');
  console.log(`Customers migrated: ${customers.length}`);
  console.log(`Contact requests migrated: ${contacts.length}`);
  console.log(`Total leads created: ${leadsCount}`);
  console.log(`Merged (same phone): ${customers.length + contacts.length - leadsToInsert.length}`);

  await mongoose.disconnect();
  console.log('\nMigration complete!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
