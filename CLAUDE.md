# Agent Rules — PropertyTaxCalculator (מחשבון ארנונה)

> These rules apply to every LLM agent (Claude, Cursor, Copilot, etc.) working on this codebase.

---

## Project Overview

Israeli property tax (ארנונה) calculator. Citizens enter property details, the system looks up the correct rate from municipal ordinances (צווי ארנונה), compares with their actual bill, identifies overpayments, and can generate AI appeal letters (השגה).

- **Language:** Hebrew (RTL). All user-facing strings are in Hebrew.
- **Target:** Israeli citizens checking residential or business property tax.
- **Monetization:** Paid results (₪34) and AI appeal letters (₪180).

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript (strict) | 5.9 |
| UI Library | MUI + Emotion | 7.x |
| RTL | stylis-plugin-rtl | — |
| Forms | react-hook-form + zod + @hookform/resolvers | — |
| Database | MongoDB + Mongoose | 9.x |
| Auth | JWT (jsonwebtoken) + bcryptjs | — |
| Animation | Framer Motion | 12.x |
| Carousel | Swiper | 12.x |
| AI/OCR | @google/generative-ai | — |
| Testing | Vitest + @testing-library | 4.x |
| Runtime | React 19, Node.js | — |

---

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # Route handlers (REST API)
│   ├── admin/              # Admin panel pages
│   ├── blog/               # Blog/educational content
│   ├── calculator/         # Calculator wizard page
│   └── landing/            # Marketing/landing pages
├── components/             # React components (by domain)
│   ├── admin/
│   ├── blog/
│   ├── calculator/
│   │   └── steps/          # Wizard step components
│   ├── common/             # Shared/reusable components (e.g. DocumentPreviewPopover)
│   ├── editor/
│   └── landing/
├── lib/                    # Core logic
│   ├── models/             # Mongoose schemas + TS interfaces
│   ├── calculator.ts       # Tax calculation engine
│   ├── mongodb.ts          # DB connection singleton
│   ├── auth.ts             # JWT helpers
│   └── vision/             # OCR / document extraction
├── hooks/                  # Custom React hooks
├── data/                   # Seed/mock data (JSON)
├── styles/                 # Global CSS
├── theme/                  # MUI theme + ThemeRegistry
├── test/                   # Test setup & utilities
└── scripts/                # Utility scripts (seeding, etc.)
```

### Key Rules

- **Path alias:** Always use `@/*` imports (maps to `./src/*`). Never use relative `../../../` paths.
- **Server vs Client components:** Default to server components. Only add `'use client'` when the component needs browser APIs, hooks, or event handlers.
- **Dynamic imports:** Use `next/dynamic` for heavy client components (e.g., CalculatorWizard) to improve loading performance.
- **Route-level states:** Use `loading.tsx` and `error.tsx` files for route-level loading/error UI instead of manual state management.

---

## Naming & File Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase `.tsx` | `CitySelectStep.tsx` |
| Directories | kebab-case | `calculator/steps/` |
| Mongoose models | PascalCase with `I` prefix for interfaces | `ICityTariff`, `ICustomer` |
| API routes | `route.ts` inside path dirs | `src/app/api/cities/route.ts` |
| Test files | `*.test.ts` inside `__tests__/` | `src/app/api/cities/__tests__/cities.test.ts` |
| Hooks | camelCase with `use` prefix | `useCalculator.ts` |

---

## UI & Styling Rules

### Theme — ALWAYS Use Theme Variables

**Never hardcode color values.** Always reference the MUI theme:

```tsx
// GOOD
color: theme.palette.primary.main
backgroundColor: theme.palette.background.paper
theme.palette.secondary.light

// BAD
color: '#1a4fdb'
backgroundColor: '#ffffff'
```

This keeps the palette dynamic and consistent across the app. If a new color is needed, add it to `src/theme/theme.ts` first, then reference it via the theme.

### Theme Palette Reference

- `primary.main` — brand blue
- `primary.light` / `primary.dark` — blue variants
- `secondary.main` — teal/green accent
- `secondary.light` / `secondary.dark` — teal variants
- `background.default` — page background
- `background.paper` — card/surface background
- `success.main`, `error.main`, `warning.main` — status colors

### RTL

- The app is fully RTL (`dir="rtl"`, `lang="he"`).
- Emotion cache uses `stylis-plugin-rtl` in `src/theme/ThemeRegistry.tsx`.
- Always test layout changes in RTL. Use MUI's RTL-aware props (e.g., `marginInlineStart` over `marginLeft`).
- Never break RTL layout.

### Fonts

- **Heebo** — Hebrew text (primary)
- **Inter** — Latin text / numbers
- Both loaded via `next/font/google` in `src/app/layout.tsx` as CSS variables.

### Accessibility

- Preserve the skip-to-content link in layout.
- All interactive elements must have Hebrew `aria-label` or visible labels.
- Maintain focus styles in CSS.
- Keep the `AccessibilityWidget` component.

---

## Next.js Best Practices

### Minimize `useEffect`

Avoid `useEffect` for things Next.js handles natively. Prefer:

| Instead of... | Use... |
|--------------|--------|
| `useEffect` to fetch data | Server components with `async`/`await` |
| `useEffect` + `useState` for form submission | Server Actions / form actions |
| `useEffect` to track form state | `useFormStatus` / `useActionState` |
| `useEffect` for loading states | `loading.tsx` route files |
| `useEffect` for error handling | `error.tsx` route files |
| Client-side redirect in `useEffect` | `redirect()` in server components or middleware |

Only use `useEffect` when genuinely needed (DOM measurements, third-party library init, subscriptions).

### Server Actions & Form Actions

- Use Server Actions for mutations (create, update, delete).
- Use form `action` prop instead of `onSubmit` + manual fetch where possible.
- Keep server actions in separate files or inline with `'use server'`.

### Data Fetching

- Fetch data in server components, not in client components with `useEffect`.
- Use route handlers (`route.ts`) for API endpoints consumed by external clients.
- Colocate data fetching with the component that needs it.

---

## Code Patterns

### Reuse Code — No Duplication

- **Before writing new code**, search for existing utilities, components, and patterns that do the same thing.
- Extract shared logic into utility functions in `src/lib/`.
- Extract shared UI into reusable components in `src/components/common/`.
- If you see 2+ components doing the same thing, refactor into a shared abstraction.
- Reuse existing DB connection (`src/lib/mongodb.ts`), auth helpers (`src/lib/auth.ts`), and model patterns.

### Forms

- Use `react-hook-form` with `zod` schemas via `@hookform/resolvers`.
- Define Zod schemas close to where they're used.
- Use the wizard pattern (step components in `src/components/calculator/steps/`) for multi-step flows.

### Calculator wizard & ordinance PDF

- **Shell:** `src/components/calculator/CalculatorWizard.tsx` — step flow, shared state, and `ContactRedirectStep` when the flow cannot continue.
- **Steps:** `src/components/calculator/steps/*.tsx` — each receives `StepProps` (`state`, `dispatch` from the wizard reducer).
- **צו ארנונה (municipal PDF):** URL comes from `cityData.ordinanceUrl` on the city tariff (`ICityTariff` / `GET /api/cities/[id]`). Use **`DocumentPreviewPopover`** at `src/components/common/DocumentPreviewPopover.tsx` for the Hebrew trigger, MUI Popover preview (iframe), and download action. Reuse it anywhere you need the same PDF preview + download pattern (implement this file once if it is not in the tree yet; avoid one-off duplicate modal/iframe code).
- **No separate “rate info” step:** Do not reintroduce a dedicated ordinance-only wizard step; keep ordinance UX in the shell or shared component above.

### Mongoose Models

- Define TypeScript interfaces with `I` prefix alongside Mongoose schemas.
- Export both the interface and the model.
- Use the singleton pattern for config models (see `Settings.ts`).
- Check `mongoose.models` before defining to prevent recompilation errors:
  ```ts
  export default (mongoose.models.ModelName as Model<IModelName>) || mongoose.model<IModelName>('ModelName', schema);
  ```

### Error Handling

- API routes return proper HTTP status codes with JSON `{ error: string }` bodies.
- Use try/catch in route handlers. Don't swallow errors silently.
- Admin endpoints check JWT auth via `src/lib/auth.ts`.

---

## API Conventions

- All API routes live under `src/app/api/`.
- RESTful: `GET` for reads, `POST` for creates, `PUT` for updates, `DELETE` for deletes.
- Public endpoints: cities list, tax calculation, contact form, coupon validation.
- Admin endpoints: require JWT in Authorization header. Use `verifyAuth()` from `src/lib/auth.ts`.
- Pagination: use `page` and `limit` query params where applicable.
- Always validate request body before processing.

---

## Domain Knowledge

### Tariff Tree (Rate Lookup)

```
City → PropertyType → SubType → Zone → (optional SizeRange) → Rate (₪/sqm/year)
```

- **PropertyType**: `private` (מגורים) or `business` (עסקים) — has a `category` field.
- **SubType**: e.g., apartments (דירות), retail (חנויות).
- **Zone**: City-defined zones (e.g., אזור א, אזור ב). Some cities have a single "all" zone.
- **SizeRange**: Optional. Some subtypes have flat rates per zone; others vary by property size (min/max sqm).
- **Rate**: ₪ per square meter per year.

Model: `src/lib/models/CityTariff.ts`
Engine: `src/lib/calculator.ts`

### Exemptions (הנחות)

- Structured as sections (סעיפים) → subsections (תתי סעיפים).
- Each subsection has: discount %, area cap (maxAreaSqm), eligibility conditions.
- **Only the highest discount applies** — no stacking.
- If area cap exists, discount applies only to that area; the rest is full rate.
- Per city — each municipality defines its own exemptions.

### Calculation Flow

1. Look up rate: `findRate(tariff, typeCode, subtypeCode, zone, sizeSqm)`
2. Calculate annual: `propertyArea × rate`
3. Apply best exemption (if selected): respect area caps
4. Bimonthly: `annual / 6`
5. Compare with reported payment → `match | overpaying | underpaying`

### Hebrew Terminology

| Hebrew | English | Context |
|--------|---------|---------|
| ארנונה | Property tax | The main subject |
| צו ארנונה | Tax ordinance | Municipal rate document |
| השגה | Appeal | Against overcharge |
| הנחה | Discount/Exemption | Tax reduction |
| אזור | Zone | Geographic tax zone |
| מ"ר | sqm | Square meters |
| נכס | Property | Real estate unit |
| דו-חודשי | Bimonthly | Payment period |

---

## Testing

- **Framework:** Vitest with `@testing-library`.
- **Config:** `vitest.config.ts` — node environment, `@` alias, 15s timeout.
- **Test location:** `src/**/__tests__/**/*.test.ts`
- **Run:** `npm run test` (single run), `npm run test:watch` (watch mode).
- **Setup:** `src/test/setup.ts` (per-test), `src/test/global-setup.ts` (global).

---

## Development Setup

```bash
npm install           # Install dependencies
npm run dev           # Start dev server (port 3005, all interfaces)
npm run build         # Production build
npm run test          # Run tests
npm run seed:mock     # Seed mock city data
```

- **Port:** 3005 (configured to run on `0.0.0.0`).
- **Database:** MongoDB must be running locally.
- **Environment:** Requires `.env` with MongoDB URI, JWT secret, Google AI API key.

---

## Do's and Don'ts

### Do

- Use `@/*` path aliases for all imports.
- Use theme variables for all colors — never hardcode hex values.
- Write Hebrew strings for all user-facing text.
- Reuse existing utilities (`mongodb.ts`, `auth.ts`, `calculator.ts`).
- Keep components small and focused.
- Use server components by default.
- Use Server Actions for mutations.
- Test new API routes.
- Preserve RTL layout and accessibility features.

### Don't

- Don't use `useEffect` for data fetching — use server components.
- Don't hardcode color values — use `theme.palette.*`.
- Don't duplicate logic — extract shared code into utilities/components.
- Don't add `'use client'` unless the component genuinely needs it.
- Don't break RTL layout or remove accessibility features.
- Don't over-engineer — keep solutions simple and focused on the task.
- Don't add unnecessary dependencies — check if existing packages cover the need.
- Don't skip auth checks on admin endpoints.
- Don't use relative imports (`../../../`) — use `@/*`.
