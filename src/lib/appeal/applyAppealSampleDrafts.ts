import type {
  IAppealLetterSampleSlotView,
  IAppealSampleDraftSlot,
} from '@/lib/types/appeal-letter-sample';

const APPEAL_SAMPLE_PDF_MIME = 'application/pdf';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function validatePendingFile(file: File): void {
  if (file.type !== APPEAL_SAMPLE_PDF_MIME) {
    throw new Error('ניתן להעלות קובצי PDF בלבד');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('הקובץ גדול מ-10MB');
  }
}

async function uploadAppealSample(slot: number, file: File): Promise<void> {
  validatePendingFile(file);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('slot', String(slot));
  const res = await fetch('/api/admin/appeal-samples', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'העלאת דוגמה נכשלה');
  }
}

async function deleteAppealSample(slot: number): Promise<void> {
  const res = await fetch(`/api/admin/appeal-samples?slot=${slot}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'מחיקת דוגמה נכשלה');
  }
}

async function fetchAppealSampleSlots(): Promise<IAppealLetterSampleSlotView[]> {
  const res = await fetch('/api/admin/appeal-samples', { credentials: 'same-origin' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'טעינת דוגמאות נכשלה');
  }
  return Array.isArray(body.slots) ? (body.slots as IAppealLetterSampleSlotView[]) : [];
}

/**
 * Applies staged add/remove/replace operations from the edit dialog (on save only).
 */
export async function applyAppealSampleDrafts(
  drafts: IAppealSampleDraftSlot[],
): Promise<IAppealLetterSampleSlotView[]> {
  for (const draft of drafts) {
    const hadSaved = draft.savedFile !== null;

    if (draft.removed && !draft.pendingFile && hadSaved) {
      await deleteAppealSample(draft.slot);
    }

    if (draft.pendingFile) {
      await uploadAppealSample(draft.slot, draft.pendingFile);
    }
  }

  return fetchAppealSampleSlots();
}
