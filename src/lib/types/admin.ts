/**
 * Shared types for Admin UI components.
 *
 * These cover admin-specific display types that don't belong
 * to a specific domain model but are used across admin pages.
 */

import type { ReactNode } from 'react';
import type { ICalculationResult } from './customer';

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

// ── Customer list item (admin list view) ────────────────────────────
export type CustomerStatus = 'in_progress' | 'match' | 'overpaying' | 'underpaying' | 'appeal_filed';
export type PaymentStatus = 'none' | 'calculator_paid' | 'appeal_paid';

export interface CustomerListItem {
  _id: string;
  fullName: string;
  idNumber: string;
  email?: string;
  phone?: string;
  propertyType: 'private' | 'business';
  citySlug: string;
  propertyNumber?: string;
  propertyId?: string;
  address?: string;
  propertyArea: number;
  coveredBalconyArea?: number;
  storageArea?: number;
  parkingArea?: number;
  classificationCode?: string;
  zone?: string;
  bimonthlyPayment: number;
  calculationResult?: ICalculationResult;
  householdSize?: number;
  childrenCount?: number;
  paymentStatus: PaymentStatus;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Stat card props (admin dashboard) ───────────────────────────────
export type StatPaletteColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: StatPaletteColor;
}
