/**
 * Shared plain-data interfaces for the Settings domain.
 *
 * These are the single source of truth for site settings structures.
 * The Mongoose model (`src/lib/models/Settings.ts`) and all consumers
 * import from here.
 */

// ── Settings data (plain, no Mongoose Document) ─────────────────────
export interface ISettingsData {
  siteName: string;
  siteDescription: string;
  defaultAuthor: string;
  postsPerPage: number;
  defaultOgImage: string;
  googleAnalyticsId: string;
  customHeadCode: string;
  customCss: string;
}
