/**
 * Shared plain-data interfaces for the System Config domain.
 *
 * These are the single source of truth for system configuration structures.
 * The Mongoose model (`src/lib/models/SystemConfig.ts`) and all consumers
 * import from here.
 */

import type { AppealSampleSlot, IAppealLetterSampleFile } from '@/lib/types/appeal-letter-sample';

// ── Contact emails sub-document interface ───────────────────────────
export interface IContactEmails {
  service: string;
  noreply: string;
  calculator: string;
}

// ── System config data (plain, no Mongoose Document) ────────────────
export interface ISystemConfigData {
  _id?: string;
  paymentEnabled: boolean;
  systemEnabled: boolean;
  calculatorPrice: number;
  appealPrice: number;
  /** Max gap for `match`: fixed ₪ on bimonthly diff, or % of calculated bimonthly when `matchToleranceIsPercent` */
  matchToleranceValue: number;
  matchToleranceIsPercent: boolean;
  contactEmails?: IContactEmails;
  /** Up to 3 admin-managed PDFs used as Gemini appeal letter examples. */
  appealLetterSamples?: IAppealLetterSampleFile[];
}

/** Stored on the Mongoose document (dates not yet serialized). */
export interface IAppealLetterSampleStored {
  slot: AppealSampleSlot;
  pathname: string;
  blobUrl: string;
  originalFilename: string;
  mimeType: string;
  updatedAt?: Date;
}

export const DEFAULT_MATCH_TOLERANCE_VALUE = 10;
export const DEFAULT_MATCH_TOLERANCE_IS_PERCENT = false;

/** Normalize tolerance fields from DB/API for calculator calls (invalid numbers fall back to default ₪ value). */
export function parseMatchToleranceFromConfig(raw: {
  matchToleranceValue?: unknown;
  matchToleranceIsPercent?: unknown;
}): { matchToleranceValue: number; matchToleranceIsPercent: boolean } {
  let matchToleranceValue = DEFAULT_MATCH_TOLERANCE_VALUE;
  const v = raw.matchToleranceValue;
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
    matchToleranceValue = v;
  }
  const matchToleranceIsPercent = raw.matchToleranceIsPercent === true;
  return { matchToleranceValue, matchToleranceIsPercent };
}

/** Flags + prices passed from server into CalculatorWizard / landing CTA */
export type CalculatorFeatureConfig = Pick<
  ISystemConfigData,
  'paymentEnabled' | 'systemEnabled' | 'calculatorPrice' | 'appealPrice'
>;

export const DEFAULT_CALCULATOR_FEATURE_CONFIG: CalculatorFeatureConfig = {
  paymentEnabled: false,
  systemEnabled: true,
  calculatorPrice: 34,
  appealPrice: 180,
};

/** Map API/DB plain object to calculator-facing flags (defaults match mongoose schema). */
export function toCalculatorFeatureConfig(raw: Partial<ISystemConfigData>): CalculatorFeatureConfig {
  return {
    paymentEnabled: raw.paymentEnabled !== false,
    systemEnabled: raw.systemEnabled !== false,
    calculatorPrice:
      typeof raw.calculatorPrice === 'number' && !Number.isNaN(raw.calculatorPrice)
        ? raw.calculatorPrice
        : DEFAULT_CALCULATOR_FEATURE_CONFIG.calculatorPrice,
    appealPrice:
      typeof raw.appealPrice === 'number' && !Number.isNaN(raw.appealPrice)
        ? raw.appealPrice
        : DEFAULT_CALCULATOR_FEATURE_CONFIG.appealPrice,
  };
}
