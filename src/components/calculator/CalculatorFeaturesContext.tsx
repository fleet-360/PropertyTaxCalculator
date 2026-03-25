'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_CALCULATOR_FEATURE_CONFIG } from '@/lib/types/system-config';

export interface CalculatorFeaturesContextValue {
  paymentEnabled: boolean;
  calculatorPrice: number;
  appealPrice: number;
  /** Amount to charge for detailed results (after coupon) */
  calculatorChargeAmount: number;
  /** Amount to charge for appeal (after coupon) */
  appealChargeAmount: number;
}

const defaultContextValue: CalculatorFeaturesContextValue = {
  paymentEnabled: DEFAULT_CALCULATOR_FEATURE_CONFIG.paymentEnabled,
  calculatorPrice: DEFAULT_CALCULATOR_FEATURE_CONFIG.calculatorPrice,
  appealPrice: DEFAULT_CALCULATOR_FEATURE_CONFIG.appealPrice,
  calculatorChargeAmount: DEFAULT_CALCULATOR_FEATURE_CONFIG.calculatorPrice,
  appealChargeAmount: DEFAULT_CALCULATOR_FEATURE_CONFIG.appealPrice,
};

export const CalculatorFeaturesContext = createContext<CalculatorFeaturesContextValue>(defaultContextValue);

export function useCalculatorFeatures(): CalculatorFeaturesContextValue {
  return useContext(CalculatorFeaturesContext);
}
