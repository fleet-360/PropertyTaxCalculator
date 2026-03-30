import type { AppealGenerateRequest } from './schemas';

/**
 * Short English lines for Gemini — which example template likely fits this case.
 * Derived from wizard/calculation signals (no PII beyond what is already in the payload).
 */
export function buildAppealNarrativeHints(payload: AppealGenerateRequest): string[] {
  const hints: string[] = [];
  const calc = payload.calculationResult ?? {};
  const outcome =
    typeof calc.outcome === 'string' && ['match', 'overpaying', 'underpaying'].includes(calc.outcome)
      ? (calc.outcome as 'match' | 'overpaying' | 'underpaying')
      : undefined;

  if (payload.measurementError != null && payload.measurementError.claimed > 0) {
    hints.push(
      `Area correction: the user reports the correct property size is ${payload.measurementError.claimed} sqm (disputes the area used for taxation). Prefer a template focused on correcting measured / registered areas.`,
    );
  }

  const suggested = payload.classificationError?.suggested?.trim();
  if (suggested) {
    hints.push(
      `Classification correction: the user argues the property should be classified as "${suggested}". Prefer a template focused on wrong area classification (סיווג שטחים).`,
    );
  }

  const purpose = payload.propertyPurpose?.trim();
  if (purpose) {
    hints.push(
      `Stated use / situation (Hebrew, from user): "${purpose}". Use this to judge vacant-property, unused-property, or general discount templates.`,
    );
  }

  if (outcome === 'overpaying') {
    hints.push(
      'Calculation outcome: user appears to be overpaying vs. the calculator — appeal likely seeks reduction or application of a lower rate / discount.',
    );
  } else if (outcome === 'underpaying') {
    hints.push(
      'Calculation outcome: reported payment is below calculated liability — appeal may still concern exemptions, classification, or future periods; choose template by dispute type above.',
    );
  } else if (outcome === 'match') {
    hints.push(
      'Calculation outcome: reported payment is close to calculated amount — template choice should rely mainly on stated dispute (area, classification, vacancy, exemptions).',
    );
  }

  const ex = payload.selectedExemptions;
  if (ex && ex.length > 0) {
    const labels = ex
      .map((e) => e.label?.trim())
      .filter(Boolean)
      .slice(0, 8) as string[];
    hints.push(
      `Selected exemption candidates in wizard (${ex.length}): ${labels.length ? labels.join('; ') : 'codes only — see exemptions array'}. Prefer general or specific exemption templates if they match.`,
    );
  }

  if (payload.propertyType === 'business' && payload.designations && payload.designations.length > 0) {
    const nonempty = payload.designations.filter((d) => d.type?.trim() && d.area > 0);
    if (nonempty.length > 1) {
      hints.push(
        'Business property with multiple designations (mixed uses / areas) — pick a template that fits compound business appeals if available.',
      );
    }
  }

  const partial =
    (payload.coveredBalconyArea != null && payload.coveredBalconyArea > 0) ||
    (payload.storageArea != null && payload.storageArea > 0) ||
    (payload.parkingArea != null && payload.parkingArea > 0) ||
    (payload.additionalAreas != null && payload.additionalAreas.some((a) => a.areaSqm > 0));
  if (partial) {
    hints.push(
      'User provided breakdown of partial areas (balcony, storage, parking, or dynamic area types) — relevant for area-classification or area-correction templates.',
    );
  }

  if (payload.block?.trim() || payload.parcel?.trim() || payload.classificationCode?.trim()) {
    hints.push(
      'Cadastral / registry hints present (block, parcel, and/or classification code) — use in the letter where the chosen template expects them.',
    );
  }

  return hints;
}
