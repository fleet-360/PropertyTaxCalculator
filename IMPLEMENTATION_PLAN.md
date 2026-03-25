# Property Tax Calculator (מחשבון ארנונה) - Implementation Plan

## Context

Building a property tax calculator for Israeli citizens to check if they're overpaying on municipal property tax (ארנונה). The system compares actual payments vs. what should be paid per official municipal tax ordinances, and offers AI-generated appeal letters (השגה) for overcharges.

**Stack:** Next.js 16 + MUI 7 + MongoDB/Mongoose + TypeScript
**Design:** Minimal (final design TBD), easily changeable. RTL Hebrew.
**Design inspiration:** bos-webdesign.com (style), comigo.co.il (animations)

---

## Phase 0: Structural Groundwork

### Routing Reorganization
- Public blog and calculator live under `src/app/(public)/` with a shared `layout.tsx` (URLs remain `/blog`, `/calculator`); landing stays at `src/app/page.tsx` with its own Navbar/Footer.
- Historical note: blog was previously moved from `(blog)/` to a top-level segment; it now sits under `(public)/` next to `calculator/`.

### RTL & Hebrew Setup
- `src/app/layout.tsx` — `lang="he"`, `dir="rtl"`
- `src/theme/theme.ts` — `direction: 'rtl'`, light color palette
- `src/theme/ThemeRegistry.tsx` — add `stylis-plugin-rtl` to Emotion cache

### New Dependencies
```
stylis-plugin-rtl stylis             — RTL CSS
react-hook-form zod @hookform/resolvers — form wizard
framer-motion                        — animations
swiper                               — carousels/marquee
```

---

## Phase 1: Data Models & Calculation Engine

### 1.1 Tariff Data Model — Nested Tree

Each city has a self-contained tariff tree. Rate lookup:
`City → Type → SubType → Zone → (optional SizeRange) → Rate`

**File: `src/lib/models/CityTariff.ts`**

```typescript
interface SizeRange {
  min: number;              // sqm, inclusive
  max: number;              // sqm, inclusive (-1 = unlimited)
  rate: number;             // ₪ per sqm per year
  propertyCode?: string;    // city-specific code (e.g., "311")
}

interface ZoneRate {
  zone: string;             // zone identifier (e.g., "א", "1")
  zoneLabel: string;        // display name (e.g., "אזור א")
  rate?: number;            // direct rate (when no size ranges)
  sizeRanges?: SizeRange[]; // rate by property size
  propertyCode?: string;    // code when no size ranges
}

interface SubType {
  code: string;             // e.g., "apartments", "retail"
  label: string;            // e.g., "דירות", "חנויות"
  hasSizeRanges: boolean;
  zones: ZoneRate[];
}

interface PropertyType {
  code: string;             // e.g., "residential", "business"
  label: string;            // e.g., "מגורים", "עסקים"
  subtypes: SubType[];
}

// Mongoose schema
CityTariff {
  cityName: String           // "נתניה"
  cityNameEn: String         // "Netanya"
  slug: String               // "netanya" (unique)
  year: Number               // 2026
  isActive: Boolean
  ordinanceUrl: String       // link to PDF download
  types: PropertyType[]      // full tariff tree
  exemptions: ExemptionSection[]  // discounts (see 1.2)
  availableZones: [{ code: String, label: String }]
  createdAt, updatedAt
}
```

**Example — נתניה (residential, no size ranges):**
```json
{
  "code": "residential", "label": "מגורים",
  "subtypes": [{
    "code": "apartments", "label": "דירות מגורים", "hasSizeRanges": false,
    "zones": [
      { "zone": "א", "zoneLabel": "אזור א", "rate": 94.85, "propertyCode": "211" },
      { "zone": "ב", "zoneLabel": "אזור ב", "rate": 88.49, "propertyCode": "212" }
    ]
  }]
}
```

**Example — נתניה (business, with size ranges):**
```json
{
  "code": "business", "label": "עסקים",
  "subtypes": [{
    "code": "retail", "label": "חנויות ומסחר", "hasSizeRanges": true,
    "zones": [{
      "zone": "1", "zoneLabel": "אזור 1",
      "sizeRanges": [
        { "min": 0, "max": 15, "rate": 300.00, "propertyCode": "311" },
        { "min": 16, "max": 50, "rate": 355.71 },
        { "min": 51, "max": 100, "rate": 280.00 },
        { "min": 1001, "max": -1, "rate": 200.00 }
      ]
    }]
  }]
}
```

**Example — אשדוד (residential WITH size ranges, citywide zone):**
```json
{
  "code": "residential", "label": "מגורים",
  "subtypes": [{
    "code": "apartments", "label": "דירות", "hasSizeRanges": true,
    "zones": [{
      "zone": "all", "zoneLabel": "בכל העיר",
      "sizeRanges": [
        { "min": 0, "max": 75, "rate": 43.62 },
        { "min": 76, "max": -1, "rate": 65.19 }
      ]
    }]
  }]
}
```

### 1.2 Exemptions/Discounts — הנחות למגורים

Structure: סעיף (Section) → תתי סעיפים (SubSections).
Each subsection may have different discount % and restrictions based on children/household count.
**Per city** — each city defines its own exemptions.

```typescript
interface ExemptionRestrictions {
  maxAreaSqm?: number;       // שטח מקסימלי להנחה
  minChildren?: number;      // מספר ילדים מינימלי
  minHouseholdSize?: number; // מספר נפשות מינימלי
}

interface ExemptionSubSection {
  code: string;              // e.g., "senior_with_pension"
  description: string;       // תיאור סיבת ההנחה
  discountPercent: number;   // אחוז הנחה (25, 40, 80, 100)
  restrictions: ExemptionRestrictions;
  requiresDocuments: boolean;
  documentTypes: string[];   // ["אישור ביטוח לאומי", "תצהיר"]
}

interface ExemptionSection {
  sectionCode: string;       // מספר סעיף
  sectionLabel: string;      // שם הסעיף (e.g., "אזרח ותיק")
  subSections: ExemptionSubSection[];
}
```

**Example:**
```json
[
  {
    "sectionCode": "1", "sectionLabel": "אזרח ותיק",
    "subSections": [
      { "code": "senior_25", "description": "אזרח ותיק שאינו מקבל קצבה", "discountPercent": 25, "restrictions": { "maxAreaSqm": 100 }, "requiresDocuments": true, "documentTypes": ["תעודת זהות"] },
      { "code": "senior_100", "description": "אזרח ותיק המקבל גמלת סיעוד מלאה", "discountPercent": 100, "restrictions": { "maxAreaSqm": 100 }, "requiresDocuments": true, "documentTypes": ["אישור ביטוח לאומי"] }
    ]
  },
  {
    "sectionCode": "3", "sectionLabel": "הכנסה לנפש",
    "subSections": [
      { "code": "income_small", "description": "הכנסה נמוכה - עד 4 נפשות", "discountPercent": 81, "restrictions": { "maxAreaSqm": 70, "minHouseholdSize": 1 }, "requiresDocuments": true, "documentTypes": ["אישור הכנסות"] },
      { "code": "income_large", "description": "הכנסה נמוכה - 5+ נפשות", "discountPercent": 81, "restrictions": { "maxAreaSqm": 90, "minHouseholdSize": 5 }, "requiresDocuments": true, "documentTypes": ["אישור הכנסות"] }
    ]
  }
]
```

**Exemption calculation rules:**
1. User selects applicable exemption subsection(s)
2. System applies ONLY the highest discount (no stacking)
3. If `maxAreaSqm` set → discount on that area only; rest at full rate
4. If `minChildren`/`minHouseholdSize` → validate eligibility
5. Formula: `ratePerSqm × (1 - discountPercent/100) × eligibleArea`

### 1.3 Other Models

**Customer.ts** — fullName, idNumber, email, phone, propertyType, citySlug, propertyNumber, propertyId, address, blockParcel, propertyArea, coveredBalconyArea, storageArea, parkingArea, classificationCode, zone, bimonthlyPayment, designations (business), calculationResult, exemptions, uploadedDocuments, consent, paymentStatus, paymentTransactions, appealDocument, status, errorReport

**Coupon.ts** — code, discountType, discountValue, isOneTimeUse, usedBy, isActive, expiresAt

**SystemConfig.ts** (singleton) — paymentEnabled, systemEnabled, calculatorPrice (34), appealPrice (180), contactEmails

**ContactRequest.ts** — name, phone, email, message, source, status

### 1.4 Calculation Engine (`src/lib/calculator.ts`)

```
findRate(tariff, typeCode, subtypeCode, zone, sizeSqm):
  1. Find type → subtype → zone in tree
  2. If zone.sizeRanges → match min <= size <= max → return rate
  3. If zone.rate → return rate
  4. Throw "rate not found"

calculateTax(tariff, propertyData, exemptions):
  1. rate = findRate(...)
  2. annualAmount = propertyArea × rate
  3. Apply largest exemption (maxAreaSqm cap)
  4. bimonthly = annual / 6
  5. Compare with reported bimonthlyPayment
  6. Return { match|overpaying|underpaying, savings breakdown }
```

### 1.5 Seed Data (`src/lib/seed-tariffs.ts`)
Convert 5 Excel tariff files → MongoDB: נתניה, ראשון לציון, אשדוד, הרצליה, פתח תקווה

---

## Phase 2: API Routes (`src/app/api/`)

| Route | Methods | Auth |
|-------|---------|------|
| `cities/route.ts` | GET | Public |
| `cities/[id]/route.ts` | GET, PUT, DELETE | Admin |
| `tax-rates/calculate/route.ts` | POST | Public |
| `customers/route.ts` | POST, GET | Public POST / Admin GET |
| `customers/[id]/route.ts` | GET, PUT, DELETE | Admin |
| `coupons/route.ts` | GET, POST | Admin |
| `coupons/[id]/route.ts` | PUT, DELETE | Admin |
| `coupons/validate/route.ts` | POST | Public |
| `system-config/route.ts` | GET, PUT | Public GET / Admin PUT |
| `contact/route.ts` | POST | Public |

---

## Phase 3: Calculator Wizard (`src/app/(public)/calculator/`)

Single-page wizard with step transitions. Minimal design, easily changeable. Shares `(public)/layout.tsx` with the blog (same Navbar + Footer, GA/custom head from Settings).

**Private Property Flow:**

| Step | Component | Details |
|------|-----------|---------|
| 1 | `PropertyTypeStep` | נכס פרטי / נכס עסקי |
| 2 | `CitySelectStep` | City dropdown |
| 3 | `DataEntryStep` | Manual entry: name, ID, property details, council bill data |
| 4 | *(wizard shell)* | תעריף בתוצאות; צו ארנונה — `DocumentPreviewPopover` ב־`CalculatorWizard` כשקיים `ordinanceUrl` (לא שלב נפרד) |
| 5 | `ErrorReportStep` | Measurement/classification errors |
| 6 | `ExemptionsStep` | Exemption selection + doc uploads |
| 7 | `DisclaimerStep` | Legal + consent |
| 8 | `ResultsGateStep` | Match → done / Overpaying → pay 34₪ |
| 9 | `ResultsDisplayStep` | Savings table + print/email |
| 10 | `AppealStep` | Pay 180₪ for AI appeal letter |

**Business Property adds:** `BusinessDataEntryStep` (up to 4 designations), `BusinessAlertStep` (expert recommendation if complex)

---

## Phase 4: Landing Page (`src/app/page.tsx`)

Sections: Navbar → Hero → Formulas Strip → Calculator CTA (3D visual) → Testimonials → Footer

---

## Phase 5: Admin Extensions (`src/app/admin/`)

New pages: Cities CRUD, Customers list/detail, Coupons CRUD, System Config

---

## Deferred

- **Phase 6:** Payment integration (Bit + Visa/MC) — MVP uses mock
- **Phase 7:** AI features (OCR scan, appeal generation, ordinance extraction)

---

## Files to Reuse
- `src/lib/mongodb.ts` — DB connection
- `src/lib/auth.ts` — JWT auth helpers
- `src/lib/models/Settings.ts` — singleton pattern for SystemConfig
- `src/app/admin/layout.tsx` — extend with new nav items
