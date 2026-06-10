import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/lib/models/SystemConfig';
import type { BlobBackedGeminiSource } from '@/lib/gemini/resolveBlobToGeminiFile';
import { BLOB_SAMPLE_DOCUMENTS_LIST_PREFIX } from '@/lib/services/blobUploadService';
import {
  APPEAL_SAMPLE_SLOTS,
  type AppealSampleSlot,
  type IAppealLetterSampleFile,
  type IAppealLetterSampleSlotView,
} from '@/lib/types/appeal-letter-sample';
import type { IAppealLetterSampleStored } from '@/lib/types/system-config';

export const APPEAL_SAMPLE_PDF_MIME = 'application/pdf' as const;

export function appealSampleSlotPathname(slot: AppealSampleSlot): string {
  return `${BLOB_SAMPLE_DOCUMENTS_LIST_PREFIX}appeal-sample-${slot}.pdf`;
}

export function appealSampleGeminiDisplayName(pathname: string): string {
  return `blob-sample:${pathname}`;
}

function toIso(d: unknown): string {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') return d;
  return new Date(String(d)).toISOString();
}

export function serializeAppealLetterSample(stored: IAppealLetterSampleStored): IAppealLetterSampleFile {
  return {
    slot: stored.slot,
    pathname: stored.pathname,
    blobUrl: stored.blobUrl,
    originalFilename: stored.originalFilename,
    mimeType: stored.mimeType || APPEAL_SAMPLE_PDF_MIME,
    updatedAt: toIso(stored.updatedAt ?? new Date()),
  };
}

export function buildAppealSampleSlotViews(
  samples: IAppealLetterSampleFile[] | undefined,
): IAppealLetterSampleSlotView[] {
  const bySlot = new Map<AppealSampleSlot, IAppealLetterSampleFile>();
  for (const s of samples ?? []) {
    if (APPEAL_SAMPLE_SLOTS.includes(s.slot)) {
      bySlot.set(s.slot, s);
    }
  }
  return APPEAL_SAMPLE_SLOTS.map((slot) => ({
    slot,
    file: bySlot.get(slot) ?? null,
  }));
}

export async function getStoredAppealLetterSamples(): Promise<IAppealLetterSampleFile[]> {
  await dbConnect();
  const config = await SystemConfig.getConfig();
  const raw = config.appealLetterSamples ?? [];
  return raw
    .map((s) => serializeAppealLetterSample(s))
    .sort((a, b) => a.slot - b.slot);
}

/** Blob-backed sources for Gemini — only admin-configured slots (max 3). */
export async function loadAppealLetterBlobSourcesFromConfig(): Promise<BlobBackedGeminiSource[]> {
  const samples = await getStoredAppealLetterSamples();
  return samples
    .filter((s) => s.pathname.trim() && s.blobUrl.trim())
    .slice(0, 3)
    .map((s) => ({
      displayName: appealSampleGeminiDisplayName(s.pathname),
      blobUrl: s.blobUrl,
      mimeType: s.mimeType || APPEAL_SAMPLE_PDF_MIME,
    }));
}

export async function upsertAppealLetterSampleSlot(
  slot: AppealSampleSlot,
  file: Omit<IAppealLetterSampleFile, 'slot' | 'updatedAt'>,
): Promise<IAppealLetterSampleFile[]> {
  await dbConnect();
  const config = await SystemConfig.getConfig();
  const now = new Date();
  const entry: IAppealLetterSampleStored = {
    slot,
    pathname: file.pathname,
    blobUrl: file.blobUrl,
    originalFilename: file.originalFilename,
    mimeType: file.mimeType || APPEAL_SAMPLE_PDF_MIME,
    updatedAt: now,
  };

  const existing = (config.appealLetterSamples ?? []).filter((s) => s.slot !== slot);
  const next = [...existing, entry].sort((a, b) => a.slot - b.slot);

  await SystemConfig.findByIdAndUpdate(config._id, {
    $set: { appealLetterSamples: next },
  });

  return next.map((s) => serializeAppealLetterSample(s));
}

export async function removeAppealLetterSampleSlot(
  slot: AppealSampleSlot,
): Promise<IAppealLetterSampleFile[]> {
  await dbConnect();
  const config = await SystemConfig.getConfig();
  const next = (config.appealLetterSamples ?? []).filter((s) => s.slot !== slot);

  await SystemConfig.findByIdAndUpdate(config._id, {
    $set: { appealLetterSamples: next },
  });

  return next.map((s) => serializeAppealLetterSample(s));
}

export async function getAppealLetterSampleForSlot(
  slot: AppealSampleSlot,
): Promise<IAppealLetterSampleFile | null> {
  const samples = await getStoredAppealLetterSamples();
  return samples.find((s) => s.slot === slot) ?? null;
}
