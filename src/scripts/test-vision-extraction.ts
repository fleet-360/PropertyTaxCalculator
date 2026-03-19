/**
 * Test script for Gemini Vision extraction.
 *
 * Usage:
 *   npx tsx src/scripts/test-vision-extraction.ts <path-to-document>
 *
 * Example:
 *   npx tsx src/scripts/test-vision-extraction.ts "../documents/תשלומי ארנונה לדוגמה/דוח ארנונה אשדוד.pdf"
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { extractFromDocument } from '../lib/vision/extractor';
import type { ImageInput } from '../lib/vision/types';
import type { TaxBillData } from '../lib/vision/document-types/tax-bill';

// ── MIME type detection ────────────────────────────────────────────

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// ── Confidence color ───────────────────────────────────────────────

function confidenceColor(confidence: string): string {
  switch (confidence) {
    case 'high': return '\x1b[32m'; // green
    case 'medium': return '\x1b[33m'; // yellow
    case 'low': return '\x1b[31m'; // red
    default: return '\x1b[0m';
  }
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// ── Field labels ───────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Full Name (שם מלא)',
  idNumber: 'ID Number (ת.ז.)',
  propertyNumber: 'Property Number (מספר נכס)',
  propertyId: 'Property ID (זיהוי נכס)',
  address: 'Address (כתובת)',
  block: 'Block (גוש)',
  parcel: 'Parcel (חלקה)',
  propertyArea: 'Property Area (שטח הנכס)',
  coveredBalconyArea: 'Covered Balcony (מרפסת)',
  storageArea: 'Storage (מחסן)',
  parkingArea: 'Parking (חניה)',
  classificationCode: 'Classification (קוד סיווג)',
  zone: 'Zone (אזור)',
  bimonthlyPayment: 'Bimonthly Payment (דו-חודשי)',
};

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: npx tsx src/scripts/test-vision-extraction.ts <path-to-document>');
    console.error('Example: npx tsx src/scripts/test-vision-extraction.ts "../documents/תשלומי ארנונה לדוגמה/דוח ארנונה אשדוד.pdf"');
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  // Check API key
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
    console.error('Error: GEMINI_API_KEY is not set or is still the placeholder value.');
    console.error('Set it in .env.local with your real API key.');
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(resolvedPath);
  const mimeType = getMimeType(resolvedPath);

  console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD} Gemini Vision Extraction Test${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log(`  File: ${path.basename(resolvedPath)}`);
  console.log(`  Size: ${(fileBuffer.length / 1024).toFixed(1)} KB`);
  console.log(`  MIME: ${mimeType}`);
  console.log(`${BOLD}───────────────────────────────────────────────────${RESET}`);
  console.log(`  Sending to Gemini Vision...`);
  console.log();

  const imageInput: ImageInput = {
    type: 'buffer',
    data: fileBuffer,
    mimeType,
  };

  try {
    const result = await extractFromDocument<TaxBillData>('tax_bill', imageInput);

    console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD} Results${RESET}`);
    console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);
    console.log(`  Success: ${result.success ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`);
    console.log(`  Processing time: ${result.processingTimeMs}ms`);
    console.log(`  Fields extracted: ${Object.keys(result.data).length}`);

    if (result.warnings.length > 0) {
      console.log(`  Warnings: ${result.warnings.join(', ')}`);
    }

    console.log(`${BOLD}───────────────────────────────────────────────────${RESET}`);
    console.log(`${BOLD} Extracted Fields:${RESET}`);
    console.log();

    for (const [key, field] of Object.entries(result.data)) {
      if (!field) continue;
      const label = FIELD_LABELS[key] || key;
      const color = confidenceColor(field.confidence);

      console.log(`  ${BOLD}${label}:${RESET}`);
      console.log(`    Value:      ${field.value}`);
      console.log(`    Confidence: ${color}${field.confidence}${RESET}`);
      if (field.rawText) {
        console.log(`    Raw text:   ${DIM}${field.rawText}${RESET}`);
      }
      console.log();
    }

    console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);

    // Output raw JSON for programmatic use
    const outputPath = resolvedPath.replace(/\.[^.]+$/, '_extraction_result.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`  JSON result saved to: ${path.basename(outputPath)}`);
    console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);

  } catch (error) {
    console.error('Extraction failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
