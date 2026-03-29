import { put, type PutBlobResult } from '@vercel/blob';

/** Internal folder key; maps to Vercel Blob path prefixes below. */
export enum BlobUploadFolder {
  Orders = 'orders',
  Samples = 'samples',
}

const FOLDER_PREFIX: Record<BlobUploadFolder, string> = {
  [BlobUploadFolder.Orders]: 'Property tax orders',
  [BlobUploadFolder.Samples]: 'Sample documents',
};

/** Matches city slugs as stored on `CityTariff` (lowercase, hyphen-separated). */
export const CITY_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class BlobUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlobUploadValidationError';
  }
}

/** Last path segment only; strips `../` and directory prefixes. */
export function basenameOnly(filename: string): string {
  const normalized = filename.replace(/\\/g, '/');
  const seg = normalized.split('/').pop() ?? '';
  return seg;
}

/** Stem used in orders path: safe characters, Hebrew allowed, no empty result. */
export function sanitizeOrderStem(stem: string): string {
  const cleaned = stem
    .trim()
    .replace(/\.+/g, '-')
    .replace(/[^\w\u0590-\u05FF-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'file';
}

export function splitFilename(name: string): { stem: string; ext: string } {
  const base = basenameOnly(name);
  const lastDot = base.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === base.length - 1) {
    return { stem: base, ext: '' };
  }
  return {
    stem: base.slice(0, lastDot),
    ext: base.slice(lastDot + 1).toLowerCase(),
  };
}

/** Samples: keep original basename; only strip path traversal and empties. */
export function sanitizeSampleFilename(originalFilename: string): string {
  let base = basenameOnly(originalFilename).trim();
  base = base.replace(/^\.+/, '');
  if (!base) {
    return 'file';
  }
  if (base.includes('/') || base.includes('\\')) {
    base = basenameOnly(base.replace(/[/\\]/g, '')) || 'file';
  }
  return base;
}

/**
 * Full pathname passed to `put()` (folder + filename; extension included for orders/samples).
 * Does not perform network I/O.
 */
export function buildBlobPathname(
  folder: BlobUploadFolder,
  originalFilename: string,
  citySlug?: string,
): string {
  const prefix = FOLDER_PREFIX[folder];

  if (folder === BlobUploadFolder.Orders) {
    const raw = citySlug?.trim().toLowerCase();
    if (!raw) {
      throw new BlobUploadValidationError('citySlug is required for property tax orders');
    }
    if (!CITY_SLUG_PATTERN.test(raw)) {
      throw new BlobUploadValidationError('Invalid citySlug format');
    }
    const { stem, ext } = splitFilename(originalFilename);
    const safeStem = sanitizeOrderStem(stem);
    const extPart = ext ? `.${ext}` : '';
    return `${prefix}/${raw}-${safeStem}${extPart}`;
  }

  const safeName = sanitizeSampleFilename(originalFilename);
  return `${prefix}/${safeName}`;
}

export interface UploadToBlobInput {
  body: Buffer;
  folder: BlobUploadFolder;
  originalFilename: string;
  /** Required when `folder` is `Orders`. */
  citySlug?: string;
  contentType?: string;
  /**
   * When true (default), Vercel appends a unique suffix before the extension to avoid collisions.
   * The city slug prefix on orders is preserved on the filename segment.
   */
  addRandomSuffix?: boolean;
}

export async function uploadToBlob(input: UploadToBlobInput): Promise<PutBlobResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }

  const pathname = buildBlobPathname(
    input.folder,
    input.originalFilename,
    input.citySlug,
  );

  const addRandomSuffix = input.addRandomSuffix ?? true;

  return put(pathname, input.body, {
    access: 'private',
    token,
    allowOverwrite: true,
    contentType: input.contentType,
    addRandomSuffix,
  });
}
