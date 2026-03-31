/**
 * Shared plain-data interfaces for the ConsentRecord domain.
 *
 * A ConsentRecord is an immutable audit trail entry capturing each
 * disclaimer / waiver acceptance by a user for legal purposes.
 */

export type ConsentType = 'data_retention' | 'legal_disclaimer';

export interface IConsentRecord {
  _id: string;

  /** ObjectId reference to the Lead (nullable — may be linked later). */
  leadId?: string;

  /** Phone number — primary identifier, denormalized for independent querying. */
  phone: string;

  /** Which disclaimer was accepted. */
  consentType: ConsentType;

  /** Human-readable version string (e.g. "1.0"). */
  consentVersion: string;

  /** SHA-256 hash of the exact text that was displayed. */
  consentTextHash: string;

  /** Full snapshot of the text the user saw. */
  consentText: string;

  /** Whether the user checked the acceptance checkbox. */
  accepted: boolean;

  /** Client IP address captured server-side. */
  ipAddress: string;

  /** Client User-Agent string. */
  userAgent: string;

  /** Server-side timestamp of the consent event. */
  timestamp: Date | string;
}
