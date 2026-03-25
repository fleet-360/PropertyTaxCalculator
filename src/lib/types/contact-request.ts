/**
 * Shared plain-data interfaces for the Contact Request domain.
 *
 * These are the single source of truth for contact request structures.
 * The Mongoose model (`src/lib/models/ContactRequest.ts`) and all consumers
 * import from here.
 */

// ── Contact request source type ─────────────────────────────────────
export type ContactSource = 'calculator_business' | 'landing_page' | 'appeal';

// ── Contact request status type ─────────────────────────────────────
export type ContactStatus = 'new' | 'contacted' | 'closed';

// ── Contact request data (plain, no Mongoose Document) ──────────────
export interface IContactRequestData {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  source: ContactSource;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}
