/**
 * Shared plain-data interfaces for the City Tariff domain.
 *
 * These are the single source of truth for tariff structures.
 * The Mongoose model (`src/lib/models/CityTariff.ts`) and all consumers
 * import from here.
 */

// ── Size range sub-document interface ────────────────────────────────
export interface ISizeRange {
  min: number;
  max: number;
  rate: number;
  propertyCode?: string;
}

// ── Zone rate sub-document interface ─────────────────────────────────
export interface IZoneRate {
  zone: string;
  zoneLabel: string;
  rate?: number;
  sizeRanges?: ISizeRange[];
  propertyCode?: string;
}

// ── Sub-type sub-document interface ──────────────────────────────────
export interface ISubType {
  code: string;
  label: string;
  hasSizeRanges: boolean;
  /** When true, size ranges use progressive (bracket/cumulative) pricing;
   *  when false, a single flat rate applies to the entire area based on which range it falls into. */
  isProgressiveRate?: boolean;
  zones: IZoneRate[];
}

// ── Property type sub-document interface ─────────────────────────────
export interface IPropertyType {
  category: 'private' | 'business';
  code: string;
  label: string;
  subtypes: ISubType[];
}

// ── Exemption restrictions sub-document interface ────────────────────
export interface IExemptionRestrictions {
  maxAreaSqm?: number;
  minChildren?: number;
  minHouseholdSize?: number;
}

// ── Exemption sub-section sub-document interface ─────────────────────
export interface IExemptionSubSection {
  code: string;
  description: string;
  discountPercent: number;
  restrictions: IExemptionRestrictions;
  requiresDocuments: boolean;
  documentTypes: string[];
}

// ── Exemption section sub-document interface ─────────────────────────
export interface IExemptionSection {
  sectionCode: string;
  sectionLabel: string;
  miaMessageId?: string;
  applicableTo: 'private' | 'business' | 'both';
  subSections: IExemptionSubSection[];
}

// ── Available zone sub-document interface ────────────────────────────
export interface IAvailableZone {
  code: string;
  label: string;
}

// ── Area type discount sub-document interface ────────────────────────
export interface IAreaTypeDiscount {
  areaType: string;           // code: "open_balcony", "pool", "storage"
  label: string;              // Hebrew: "מרפסת פתוחה", "בריכה", "מחסן"
  discountPercent: number;    // 0-100
  minimumRatePerSqm: number;  // מחיר מינימום למ"ר לאחר הנחה
}

// ── City fee/surcharge sub-document interface ────────────────────────
export interface ICityFee {
  name: string;           // שם האגרה
  amount: number;         // עלות דו-חודשית ב-₪
  isMandatory: boolean;   // האם חובה
}

// ── Plain city tariff data (no Mongoose Document) ────────────────────
export interface ICityTariffData {
  _id?: string;
  cityName: string;
  cityNameEn: string;
  slug: string;
  year: number;
  isActive?: boolean;
  ordinanceUrl?: string;
  types: IPropertyType[];
  exemptions: IExemptionSection[];
  availableZones: IAvailableZone[];
  areaTypeDiscounts: IAreaTypeDiscount[];
  cityFees: ICityFee[];
}
