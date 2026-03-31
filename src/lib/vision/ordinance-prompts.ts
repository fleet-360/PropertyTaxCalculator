/**
 * Prompt builders for multi-pass tax ordinance extraction.
 *
 * Each function fetches the prompt from the database (with fallback to
 * hardcoded defaults). The prompts instruct Gemini to extract a specific
 * section of the ordinance into the exact JSON schema expected by our
 * ICityTariffData model.
 */

import type { IAvailableZone } from '@/lib/types/city-tariff';
import { getPrompt } from '@/lib/prompts/getPrompt';

// ── Pass 1: Metadata ─────────────────────────────────────────────────

export async function buildMetadataPrompt(): Promise<string> {
  return getPrompt('ordinance_metadata');
}

// ── Pass 2: Zones ────────────────────────────────────────────────────

export async function buildZonesPrompt(): Promise<string> {
  return getPrompt('ordinance_zones');
}

// ── Pass 3: Rates (Property Types) ───────────────────────────────────

export async function buildRatesPrompt(zones: IAvailableZone[]): Promise<string> {
  const zonesJson = JSON.stringify(zones, null, 2);
  return getPrompt('ordinance_rates', { zones: zonesJson });
}

// ── Pass 4: Exemptions ───────────────────────────────────────────────

export async function buildExemptionsPrompt(): Promise<string> {
  return getPrompt('ordinance_exemptions');
}

// ── Pass 5: Extras (Area Discounts + City Fees) ──────────────────────

export async function buildExtrasPrompt(): Promise<string> {
  return getPrompt('ordinance_extras');
}
