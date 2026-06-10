import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  appealSampleGeminiDisplayName,
  appealSampleSlotPathname,
  buildAppealSampleSlotViews,
} from '@/lib/appeal/appealLetterSamplesConfig';
import {
  appealSampleDraftDisplayName,
  createAppealSampleDrafts,
} from '@/lib/types/appeal-letter-sample';

describe('appealLetterSamplesConfig', () => {
  it('builds stable slot pathnames', () => {
    expect(appealSampleSlotPathname(1)).toBe('Sample documents/appeal-sample-1.pdf');
    expect(appealSampleSlotPathname(3)).toBe('Sample documents/appeal-sample-3.pdf');
  });

  it('builds gemini display names', () => {
    expect(appealSampleGeminiDisplayName('Sample documents/appeal-sample-2.pdf')).toBe(
      'blob-sample:Sample documents/appeal-sample-2.pdf',
    );
  });

  it('returns three slot views with empty slots filled', () => {
    const views = buildAppealSampleSlotViews([
      {
        slot: 2,
        pathname: 'Sample documents/appeal-sample-2.pdf',
        blobUrl: 'https://example.com/2.pdf',
        originalFilename: 'example.pdf',
        mimeType: 'application/pdf',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    expect(views).toHaveLength(3);
    expect(views[0]?.file).toBeNull();
    expect(views[1]?.file?.slot).toBe(2);
    expect(views[2]?.file).toBeNull();
  });
});

describe('appeal sample draft helpers', () => {
  it('createAppealSampleDrafts initializes from saved slots', () => {
    const drafts = createAppealSampleDrafts([
      {
        slot: 1,
        file: {
          slot: 1,
          pathname: 'Sample documents/appeal-sample-1.pdf',
          blobUrl: 'https://example.com/1.pdf',
          originalFilename: 'a.pdf',
          mimeType: 'application/pdf',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      { slot: 2, file: null },
      { slot: 3, file: null },
    ]);
    expect(drafts).toHaveLength(3);
    expect(appealSampleDraftDisplayName(drafts[0]!)).toBe('a.pdf');
    expect(appealSampleDraftDisplayName(drafts[1]!)).toBeNull();
  });
});

describe('getAppealLetterBlobSources', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('maps configured samples to blob-backed gemini sources', async () => {
    vi.doMock('@/lib/appeal/appealLetterSamplesConfig', () => ({
      loadAppealLetterBlobSourcesFromConfig: vi.fn(async () => [
        {
          displayName: 'blob-sample:Sample documents/appeal-sample-1.pdf',
          blobUrl: 'https://example.com/1.pdf',
          mimeType: 'application/pdf',
        },
      ]),
    }));

    const { getAppealLetterBlobSources } = await import('@/lib/appeal/letter-example-uris');
    const out = await getAppealLetterBlobSources();
    expect(out).toHaveLength(1);
    expect(out[0]?.displayName).toContain('appeal-sample-1.pdf');
  });
});
