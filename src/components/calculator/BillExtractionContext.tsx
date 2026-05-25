'use client';

import { createContext, useContext } from 'react';

export interface StartExtractionOptions {
  file: File;
  expectedCityName?: string;
}

export interface BillExtractionContextValue {
  /**
   * Kicks off an async tax-bill extraction. Fire-and-forget — the caller does
   * NOT need to await the returned promise. Results / errors are pushed into
   * the wizard reducer via dispatch (the wizard owns the request lifecycle).
   *
   * Calling this again while a previous extraction is still in flight will
   * supersede the older one (older results are discarded).
   */
  startExtraction: (opts: StartExtractionOptions) => Promise<void>;
  /** Resets extraction state to `idle` and cancels any in-flight result. */
  resetExtraction: () => void;
}

const defaultValue: BillExtractionContextValue = {
  startExtraction: async () => {
    /* no-op default */
  },
  resetExtraction: () => {
    /* no-op default */
  },
};

export const BillExtractionContext =
  createContext<BillExtractionContextValue>(defaultValue);

export function useBillExtraction(): BillExtractionContextValue {
  return useContext(BillExtractionContext);
}
