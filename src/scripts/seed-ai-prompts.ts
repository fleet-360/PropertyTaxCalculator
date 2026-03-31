/**
 * Seed AI prompts into the database.
 *
 * Usage: npx tsx src/scripts/seed-ai-prompts.ts
 *
 * Uses upsert by key — will NOT overwrite existing prompts (preserves admin edits).
 */
import mongoose from 'mongoose';
import AiPrompt from '../lib/models/AiPrompt';
import { hardcodedDefaults } from '../lib/prompts/hardcoded-defaults';

const MONGODB_URI =
  process.env.MONGODB_URI_MONGODB_URI ||
  'mongodb+srv://benshuan_db_user:5u6gSXHSXLeMm6LV@taxcalculatordev.dujlziy.mongodb.net/property-tax-calculator-test?appName=taxCalculatorDev';

interface PromptSeedData {
  key: string;
  category: string;
  label: string;
  description: string;
  templateVariables: string[];
}

const PROMPT_DEFINITIONS: PromptSeedData[] = [
  {
    key: 'tax_bill_extraction',
    category: 'tax_bill',
    label: 'חילוץ שובר ארנונה',
    description: 'פרומפט לחילוץ נתונים מתמונה/מסמך של שובר ארנונה ישראלי',
    templateVariables: [],
  },
  {
    key: 'ordinance_metadata',
    category: 'ordinance',
    label: 'מטאדטה מצו ארנונה',
    description: 'פרומפט לחילוץ מידע בסיסי (שם עיר, שנה, slug) מצו ארנונה',
    templateVariables: [],
  },
  {
    key: 'ordinance_zones',
    category: 'ordinance',
    label: 'אזורים מצו ארנונה',
    description: 'פרומפט לחילוץ אזורי ארנונה מצו ארנונה',
    templateVariables: [],
  },
  {
    key: 'ordinance_rates',
    category: 'ordinance',
    label: 'תעריפים מצו ארנונה',
    description: 'פרומפט לחילוץ סוגי נכסים ותעריפים מצו ארנונה. משתמש באזורים שחולצו קודם.',
    templateVariables: ['zones'],
  },
  {
    key: 'ordinance_exemptions',
    category: 'ordinance',
    label: 'הנחות מצו ארנונה',
    description: 'פרומפט לחילוץ הנחות ופטורים מצו ארנונה',
    templateVariables: [],
  },
  {
    key: 'ordinance_extras',
    category: 'ordinance',
    label: 'תוספות מצו ארנונה',
    description: 'פרומפט לחילוץ הנחות שטח ואגרות עירוניות מצו ארנונה',
    templateVariables: [],
  },
  {
    key: 'appeal_letter_json',
    category: 'appeal',
    label: 'יצירת מכתב השגה',
    description: 'פרומפט ליצירת מכתב השגה בארנונה בפורמט JSON מובנה',
    templateVariables: ['variant', 'userJson', 'schemaVersion'],
  },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, {
    dbName: 'property-tax-calculator',
    bufferCommands: false,
  });
  console.log('Connected.');

  let created = 0;
  let skipped = 0;

  for (const def of PROMPT_DEFINITIONS) {
    const content = hardcodedDefaults[def.key];
    if (!content) {
      console.warn(`  WARN: No hardcoded default found for key "${def.key}" — skipping`);
      skipped++;
      continue;
    }

    const existing = await AiPrompt.findOne({ key: def.key });
    if (existing) {
      console.log(`  SKIP: "${def.key}" already exists (version ${existing.version})`);
      skipped++;
      continue;
    }

    await AiPrompt.create({
      key: def.key,
      category: def.category,
      label: def.label,
      description: def.description,
      content,
      templateVariables: def.templateVariables,
      isActive: true,
      version: 1,
      lastModifiedBy: 'seed-script',
    });

    console.log(`  CREATE: "${def.key}" ✓`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
