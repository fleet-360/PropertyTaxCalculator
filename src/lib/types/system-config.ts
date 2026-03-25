/**
 * Shared plain-data interfaces for the System Config domain.
 *
 * These are the single source of truth for system configuration structures.
 * The Mongoose model (`src/lib/models/SystemConfig.ts`) and all consumers
 * import from here.
 */

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
  contactEmails?: IContactEmails;
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
