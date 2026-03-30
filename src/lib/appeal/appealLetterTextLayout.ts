import {
  APPEAL_LEADING_SPACE_INDENT_PT,
  APPEAL_MAX_LINE_INDENT_PT,
  APPEAL_TAB_STOP_PT,
} from './appealPdfLayout';

/**
 * Post-process Gemini/plain appeal text so PDF layout matches common municipal templates
 * (e.g. date line after the annex reference paragraph).
 */

/**
 * Strip leading tabs/spaces (Word-style indent) and return PDF indent width.
 * Remaining string keeps internal spacing; trim only for display/BiDi via caller.
 */
export function peelLeadingWhitespaceIndent(rawLine: string): {
  indentPt: number;
  rest: string;
} {
  const m = /^[\t ]*/.exec(rawLine);
  const lead = m?.[0] ?? '';
  const tabs = (lead.match(/\t/g) ?? []).length;
  const spaces = (lead.match(/ /g) ?? []).length;
  const indentPt = Math.min(
    APPEAL_MAX_LINE_INDENT_PT,
    tabs * APPEAL_TAB_STOP_PT + spaces * APPEAL_LEADING_SPACE_INDENT_PT,
  );
  return { indentPt, rest: rawLine.slice(lead.length) };
}

/** Move a leading `תאריך:` line to immediately after the first annex (`כנספח`) line if it appeared too early. */
export function reorderAppealDateAfterAnnex(text: string): string {
  const lines = text.split('\n');
  const dateRe = /^\s*תאריך\s*[:：]/;
  let dateIdx = -1;
  let annexIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (dateIdx < 0 && dateRe.test(line)) dateIdx = i;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (/כנספח/.test(line)) {
      annexIdx = i;
      break;
    }
  }

  if (dateIdx >= 0 && annexIdx >= 0 && dateIdx < annexIdx) {
    const dateLine = lines[dateIdx]!;
    lines.splice(dateIdx, 1);
    const annexAfterRemove = annexIdx > dateIdx ? annexIdx - 1 : annexIdx;
    lines.splice(annexAfterRemove + 1, 0, dateLine);
  }

  return lines.join('\n');
}
