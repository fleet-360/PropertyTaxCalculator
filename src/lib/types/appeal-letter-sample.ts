/** Admin-managed appeal letter example PDF (one of three slots). */
export type AppealSampleSlot = 1 | 2 | 3;

export const APPEAL_SAMPLE_SLOTS: AppealSampleSlot[] = [1, 2, 3];

export const MAX_APPEAL_LETTER_SAMPLES = 3;

export interface IAppealLetterSampleFile {
  slot: AppealSampleSlot;
  pathname: string;
  blobUrl: string;
  originalFilename: string;
  mimeType: string;
  updatedAt: string;
}

/** One slot in the admin UI — filled or empty. */
export interface IAppealLetterSampleSlotView {
  slot: AppealSampleSlot;
  file: IAppealLetterSampleFile | null;
}

export function isAppealSampleSlot(value: unknown): value is AppealSampleSlot {
  return value === 1 || value === 2 || value === 3;
}

export function parseAppealSampleSlot(value: unknown): AppealSampleSlot | null {
  if (typeof value === 'string') {
    const n = Number(value.trim());
    return isAppealSampleSlot(n) ? n : null;
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    return isAppealSampleSlot(value) ? value : null;
  }
  return null;
}

/** Staged slot state in the edit dialog — applied to the server only on save. */
export interface IAppealSampleDraftSlot {
  slot: AppealSampleSlot;
  savedFile: IAppealLetterSampleFile | null;
  pendingFile: File | null;
  removed: boolean;
}

export function createAppealSampleDrafts(
  slots: IAppealLetterSampleSlotView[],
): IAppealSampleDraftSlot[] {
  return APPEAL_SAMPLE_SLOTS.map((slot) => {
    const view = slots.find((s) => s.slot === slot);
    return {
      slot,
      savedFile: view?.file ?? null,
      pendingFile: null,
      removed: false,
    };
  });
}

export function appealSampleDraftDisplayName(draft: IAppealSampleDraftSlot): string | null {
  if (draft.pendingFile) return draft.pendingFile.name;
  if (draft.removed) return null;
  return draft.savedFile?.originalFilename ?? null;
}

export function appealSampleDraftHasFile(draft: IAppealSampleDraftSlot): boolean {
  return appealSampleDraftDisplayName(draft) !== null;
}

export function savedAppealSampleFileNames(slots: IAppealLetterSampleSlotView[]): string[] {
  return slots
    .map((s) => s.file?.originalFilename)
    .filter((name): name is string => Boolean(name?.trim()));
}
