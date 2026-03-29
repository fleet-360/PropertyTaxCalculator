import {
  put,
  type PutBlobResult,
  BlobError,
  BlobAccessError,
  BlobClientTokenExpiredError,
  BlobContentTypeNotAllowedError,
  BlobFileTooLargeError,
  BlobPathnameMismatchError,
  BlobPreconditionFailedError,
  BlobRequestAbortedError,
  BlobServiceNotAvailable,
  BlobServiceRateLimited,
  BlobStoreNotFoundError,
  BlobStoreSuspendedError,
  BlobUnknownError,
} from '@vercel/blob';

/** Internal folder key; maps to Vercel Blob path prefixes below. */
export enum BlobUploadFolder {
  Orders = 'orders',
  Samples = 'samples',
}

const FOLDER_PREFIX: Record<BlobUploadFolder, string> = {
  [BlobUploadFolder.Orders]: 'Property tax orders',
  [BlobUploadFolder.Samples]: 'Sample documents',
};

/** Vercel Blob `list({ prefix })` for the sample-documents folder (includes trailing slash). */
export const BLOB_SAMPLE_DOCUMENTS_LIST_PREFIX = `${FOLDER_PREFIX[BlobUploadFolder.Samples]}/`;

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
    contentType: input.contentType,
    addRandomSuffix,
  });
}

/** JSON body for failed blob uploads (admin API). */
export interface BlobUploadErrorBody {
  error: string;
  code: string;
  /** Technical message from the SDK or server; safe for admin debugging. */
  detail?: string;
}

/**
 * Maps thrown values from `uploadToBlob` / Vercel `put()` to HTTP status and a clear admin-facing payload.
 * Subclasses are checked before the base `BlobError`.
 */
export function blobUploadFailurePayload(error: unknown): {
  status: number;
  body: BlobUploadErrorBody;
} {
  const isDev = process.env.NODE_ENV === 'development';

  if (error instanceof BlobUploadValidationError) {
    return {
      status: 400,
      body: { error: error.message, code: 'VALIDATION' },
    };
  }

  if (error instanceof Error && error.message.includes('BLOB_READ_WRITE_TOKEN')) {
    return {
      status: 500,
      body: {
        error:
          'חסר או לא הוגדר BLOB_READ_WRITE_TOKEN — הוסיפו טוקן Read-Write מחנות ה-Blob ב-Vercel ל-.env והפעילו מחדש את השרת.',
        code: 'BLOB_TOKEN_MISSING',
        ...(isDev && { detail: error.message }),
      },
    };
  }

  if (error instanceof BlobClientTokenExpiredError) {
    return {
      status: 502,
      body: {
        error:
          'טוקן ה-Blob פג תוקף. צרו טוקן Read-Write חדש בלוח הבקרה של Vercel (Storage → Blob) ועדכנו את BLOB_READ_WRITE_TOKEN.',
        code: 'BLOB_TOKEN_EXPIRED',
        detail: error.message,
      },
    };
  }

  if (error instanceof BlobStoreNotFoundError) {
    return {
      status: 502,
      body: {
        error:
          'חנות ה-Blob לא נמצאה. ודאו שהטוקן שייך לחנות Blob פעילה בפרויקט הנכון ב-Vercel.',
        code: 'BLOB_STORE_NOT_FOUND',
        detail: error.message,
      },
    };
  }

  if (error instanceof BlobStoreSuspendedError) {
    return {
      status: 503,
      body: {
        error: 'חנות ה-Blob מושעית ב-Vercel. בדקו את סטטוס ה-Storage בלוח הבקרה.',
        code: 'BLOB_STORE_SUSPENDED',
        detail: error.message,
      },
    };
  }

  if (error instanceof BlobFileTooLargeError) {
    return {
      status: 413,
      body: {
        error:
          'הקובץ חורג ממגבלת הגודל של שירות ה-Blob (או של החנות). הקטינו את הקובץ או עדכנו מגבלות ב-Vercel.',
        code: 'BLOB_FILE_TOO_LARGE',
        detail: error.message,
      },
    };
  }

  if (error instanceof BlobContentTypeNotAllowedError) {
    return {
      status: 415,
      body: {
        error:
          'סוג התוכן (Content-Type) לא מותר בהגדרות חנות ה-Blob. בדקו את מדיניות סוגי הקבצים ב-Vercel Blob.',
        code: 'BLOB_CONTENT_TYPE_NOT_ALLOWED',
        detail: error.message,
      },
    };
  }

  if (error instanceof BlobServiceRateLimited) {
    const retry = error.retryAfter;
    return {
      status: 429,
      body: {
        error:
          'הגעתם למגבלת קצב של שירות ה-Blob. נסו שוב בעוד כמה שניות.',
        code: 'BLOB_RATE_LIMITED',
        detail:
          retry != null && retry > 0
            ? `${error.message} (retryAfter: ${retry}s)`
            : error.message,
      },
    };
  }

  if (error instanceof BlobServiceNotAvailable) {
    return {
      status: 503,
      body: {
        error: 'שירות Vercel Blob אינו זמין כרגע. נסו שוב מאוחר יותר.',
        code: 'BLOB_SERVICE_UNAVAILABLE',
        detail: error.message,
      },
    };
  }

  if (error instanceof BlobPathnameMismatchError) {
    return {
      status: 400,
      body: {
        error:
          'נתיב הקובץ שנשלח לא תואם למדיניות ה-Blob. בדקו את שם הקובץ והתיקייה.',
        code: 'BLOB_PATHNAME_MISMATCH',
        detail: error.message,
      },
    };
  }

  if (error instanceof BlobAccessError) {
    return {
      status: 502,
      body: {
        error:
          'הגישה ל-Blob נדחתה (הרשאות). ודאו ש-BLOB_READ_WRITE_TOKEN הוא טוקן כתיבה תקף.',
        code: 'BLOB_ACCESS_DENIED',
        detail: error.message,
      },
    };
  }

  if (error instanceof BlobPreconditionFailedError) {
    return {
      status: 412,
      body: {
        error: 'תנאי הקדמה (למשל ETag) לא התקיים — ייתכן שהקובץ השתנה.',
        code: 'BLOB_PRECONDITION_FAILED',
        detail: error.message,
      },
    };
  }

  if (error instanceof BlobRequestAbortedError) {
    return {
      status: 500,
      body: {
        error: 'העלאה בוטלה לפני השלמה.',
        code: 'BLOB_REQUEST_ABORTED',
        detail: error.message,
      },
    };
  }

  if (error instanceof BlobUnknownError) {
    return {
      status: 502,
      body: {
        error: 'שגיאה לא מסווגת מ-Vercel Blob. פרטים בשדה detail.',
        code: 'BLOB_UNKNOWN',
        detail: error.message,
      },
    };
  }

  if (error instanceof BlobError) {
    return {
      status: 502,
      body: {
        error: `שירות ה-Blob דחה את הבקשה: ${error.message}`,
        code: 'BLOB_ERROR',
        detail: error.message,
      },
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: {
        error:
          'שגיאה פנימית בהעלאה. אם אתם במצב פיתוח, בדקו את השדה detail ואת לוג השרת.',
        code: 'INTERNAL',
        ...(isDev && { detail: error.message }),
      },
    };
  }

  return {
    status: 500,
    body: {
      error: 'שגיאה לא ידועה בהעלאה ל-Blob.',
      code: 'UNKNOWN',
    },
  };
}
