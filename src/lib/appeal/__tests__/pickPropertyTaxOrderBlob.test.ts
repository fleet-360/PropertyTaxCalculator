import { describe, expect, it } from 'vitest';
import type { BlobBackedGeminiSource } from '@/lib/gemini/resolveBlobToGeminiFile';
import { pickPropertyTaxOrderBlobForCity } from '@/lib/appeal/pickPropertyTaxOrderBlob';

function src(filename: string): BlobBackedGeminiSource {
  return {
    displayName: `blob-order:Property tax orders/${filename}`,
    blobUrl: `https://example.com/${encodeURIComponent(filename)}`,
  };
}

describe('pickPropertyTaxOrderBlobForCity', () => {
  it('returns null when empty', () => {
    expect(pickPropertyTaxOrderBlobForCity([], { slug: 'tel-aviv', name: 'תל אביב' })).toBeNull();
  });

  it('matches by citySlug prefix', () => {
    const sources = [
      src('haifa-2026.pdf'),
      src('tel-aviv-2026.pdf'),
      src('tel-aviv-2025.pdf'),
    ];
    const out = pickPropertyTaxOrderBlobForCity(sources, { slug: 'tel-aviv', name: 'תל אביב' });
    expect(out?.displayName).toContain('tel-aviv');
  });

  it('picks deterministically (lexicographically last) among multiple matches', () => {
    const sources = [src('tel-aviv-2025.pdf'), src('tel-aviv-2026.pdf')];
    const out = pickPropertyTaxOrderBlobForCity(sources, { slug: 'tel-aviv', name: 'תל אביב' });
    expect(out?.displayName).toContain('tel-aviv-2026');
  });

  it('falls back to normalized cityName when slug missing', () => {
    const sources = [src('tel-aviv-2026.pdf')];
    const out = pickPropertyTaxOrderBlobForCity(sources, { name: 'Tel Aviv' });
    expect(out?.displayName).toContain('tel-aviv');
  });
});

