import { BlobStoreNotFoundError } from '@vercel/blob';
import { describe, expect, it } from 'vitest';
import {
  basenameOnly,
  BlobUploadFolder,
  BlobUploadValidationError,
  blobUploadFailurePayload,
  buildBlobPathname,
  CITY_SLUG_PATTERN,
  sanitizeOrderStem,
  sanitizeSampleFilename,
  splitFilename,
} from '@/lib/services/blobUploadService';

describe('CITY_SLUG_PATTERN', () => {
  it('accepts hyphenated lowercase slugs', () => {
    expect(CITY_SLUG_PATTERN.test('tel-aviv')).toBe(true);
    expect(CITY_SLUG_PATTERN.test('a')).toBe(true);
    expect(CITY_SLUG_PATTERN.test('foo-bar-baz')).toBe(true);
  });

  it('rejects invalid slugs', () => {
    expect(CITY_SLUG_PATTERN.test('')).toBe(false);
    expect(CITY_SLUG_PATTERN.test('Tel-Aviv')).toBe(false);
    expect(CITY_SLUG_PATTERN.test('tel_aviv')).toBe(false);
    expect(CITY_SLUG_PATTERN.test('-tel')).toBe(false);
    expect(CITY_SLUG_PATTERN.test('tel-')).toBe(false);
  });
});

describe('basenameOnly', () => {
  it('returns last segment', () => {
    expect(basenameOnly('a/b/document.pdf')).toBe('document.pdf');
    expect(basenameOnly('a\\b\\document.pdf')).toBe('document.pdf');
  });
});

describe('splitFilename', () => {
  it('splits stem and extension', () => {
    expect(splitFilename('doc.pdf')).toEqual({ stem: 'doc', ext: 'pdf' });
    expect(splitFilename('my.file.name.pdf')).toEqual({ stem: 'my.file.name', ext: 'pdf' });
  });

  it('handles no extension', () => {
    expect(splitFilename('README')).toEqual({ stem: 'README', ext: '' });
  });
});

describe('sanitizeOrderStem', () => {
  it('normalizes unsafe characters', () => {
    expect(sanitizeOrderStem('  hello world  ')).toBe('hello-world');
  });

  it('preserves Hebrew', () => {
    expect(sanitizeOrderStem('דוח')).toBe('דוח');
  });

  it('uses fallback for empty stem', () => {
    expect(sanitizeOrderStem('---')).toBe('file');
  });
});

describe('sanitizeSampleFilename', () => {
  it('keeps simple original names', () => {
    expect(sanitizeSampleFilename('document.pdf')).toBe('document.pdf');
  });

  it('strips path-like prefixes', () => {
    expect(sanitizeSampleFilename('../../etc/passwd')).toBe('passwd');
  });

  it('handles empty basename', () => {
    expect(sanitizeSampleFilename('...')).toBe('file');
  });
});

describe('buildBlobPathname', () => {
  it('builds orders path with city slug prefix', () => {
    expect(
      buildBlobPathname(BlobUploadFolder.Orders, 'document.pdf', 'tel-aviv'),
    ).toBe('Property tax orders/tel-aviv-document.pdf');
  });

  it('throws when orders missing citySlug', () => {
    expect(() =>
      buildBlobPathname(BlobUploadFolder.Orders, 'x.pdf', undefined),
    ).toThrow(BlobUploadValidationError);
  });

  it('throws when citySlug invalid', () => {
    expect(() =>
      buildBlobPathname(BlobUploadFolder.Orders, 'x.pdf', 'Tel Aviv'),
    ).toThrow(BlobUploadValidationError);
  });

  it('builds samples path with original basename', () => {
    expect(buildBlobPathname(BlobUploadFolder.Samples, 'Specimen.pdf')).toBe(
      'Sample documents/Specimen.pdf',
    );
  });

  it('does not use citySlug for samples', () => {
    expect(
      buildBlobPathname(BlobUploadFolder.Samples, 'a.pdf', 'ignored-slug'),
    ).toBe('Sample documents/a.pdf');
  });
});

describe('blobUploadFailurePayload', () => {
  it('maps validation errors to 400', () => {
    const { status, body } = blobUploadFailurePayload(
      new BlobUploadValidationError('Invalid citySlug format'),
    );
    expect(status).toBe(400);
    expect(body.code).toBe('VALIDATION');
    expect(body.error).toContain('citySlug');
  });

  it('maps missing token config to 500 with code BLOB_TOKEN_MISSING', () => {
    const { status, body } = blobUploadFailurePayload(
      new Error('BLOB_READ_WRITE_TOKEN is not configured'),
    );
    expect(status).toBe(500);
    expect(body.code).toBe('BLOB_TOKEN_MISSING');
    expect(body.error).toContain('BLOB_READ_WRITE_TOKEN');
  });

  it('maps Vercel BlobStoreNotFoundError to 502', () => {
    const { status, body } = blobUploadFailurePayload(new BlobStoreNotFoundError());
    expect(status).toBe(502);
    expect(body.code).toBe('BLOB_STORE_NOT_FOUND');
    expect(body.detail).toBeTruthy();
  });
});
