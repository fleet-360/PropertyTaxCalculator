/**
 * Shared types for Admin UI components.
 *
 * These cover admin-specific display types that don't belong
 * to a specific domain model but are used across admin pages.
 */

import type { ReactNode } from 'react';
import type {
  LeadSource,
  LeadStatus,
  AbandonmentStage,
  ICalculationEntry,
} from './lead';

// ── City summary (admin list view) ──────────────────────────────────
export interface CitySummary {
  _id: string;
  cityName: string;
  cityNameEn: string;
  slug: string;
  year: number;
  isActive: boolean;
  ordinanceUrl?: string;
  zonesCount: number;
  typesCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Lead list item (admin list view) ─────────────────────────────────
export type PaymentStatus = 'none' | 'calculator_paid' | 'appeal_paid';

/** Payment order row joined from `paymentorders` for admin display (per calculation). */
export interface LeadCalculationPaymentOrderView {
  product: 'calculator' | 'appeal';
  status: 'pending' | 'paid' | 'failed';
  amountNis: number;
  couponCode?: string;
  transactionId?: string;
  date?: string;
}

export interface LeadCalculationListItem extends ICalculationEntry {
  paymentOrders: LeadCalculationPaymentOrderView[];
}

export interface LeadListItem {
  _id: string;

  // Personal details
  fullName: string;
  phone: string;
  email?: string;
  idNumber?: string;

  // Lead management
  source: LeadSource;
  status: LeadStatus;
  message?: string;

  // Payment
  paymentStatus: PaymentStatus;

  // Calculations history
  calculations: LeadCalculationListItem[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Re-export lead types for admin consumers
export type { LeadSource, LeadStatus, AbandonmentStage };

// ── Stat card props (admin dashboard) ───────────────────────────────
export type StatPaletteColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: StatPaletteColor;
}
