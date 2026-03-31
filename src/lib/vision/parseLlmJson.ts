/**
 * Parse a single JSON object from Gemini / LLM text output.
 *
 * The naive regex /\{[\s\S]*\}/ is greedy to the last "}" in the response, so any
 * trailing text that contains "}" corrupts the payload and JSON.parse fails
 * (e.g. "Expected ',' or ']' after array element" at a position deep in the string).
 */

function sliceBalancedObject(text: string, startIndex: number): string | null {
  if (text[startIndex] !== '{') return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < text.length; i++) {
    const c = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (c === '\\') {
        escape = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }

    if (c === '"') {
      inString = true;
      continue;
    }

    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return text.slice(startIndex, i + 1);
    }
  }

  return null;
}

/** Remove trailing commas before `]` or `}` (invalid JSON but common in LLM output). */
function repairTrailingCommas(json: string): string {
  let result = json.trim();
  let prev: string;
  do {
    prev = result;
    result = result.replace(/,(\s*[\]}])/g, '$1');
  } while (result !== prev);
  return result;
}

function extractJsonCandidateString(text: string): string | null {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const inner = (fenceMatch ? fenceMatch[1] : text).trim().replace(/^\uFEFF/, '');
  const start = inner.indexOf('{');
  if (start === -1) return null;
  return sliceBalancedObject(inner, start);
}

/**
 * Returns the root object from LLM text, or null if nothing valid was found.
 */
export function parseLlmJsonObject(text: string): Record<string, unknown> | null {
  const candidate = extractJsonCandidateString(text);
  if (!candidate) return null;

  for (const jsonStr of [candidate, repairTrailingCommas(candidate)]) {
    try {
      const parsed: unknown = JSON.parse(jsonStr);
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // try next strategy
    }
  }

  return null;
}
