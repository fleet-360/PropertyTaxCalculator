import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSettings } = vi.hoisted(() => ({
  mockGetSettings: vi.fn(),
}));

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/models/Settings', () => ({
  default: {
    getSettings: () => mockGetSettings(),
  },
}));

import { getBlogSiteSettings } from '@/lib/blog/settings';

describe('getBlogSiteSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({
      siteName: 'Test Site',
      postsPerPage: 12,
      siteDescription: 'Desc',
    });
  });

  it('returns JSON-cloned plain object', async () => {
    const s = await getBlogSiteSettings();
    expect(s).toEqual({
      siteName: 'Test Site',
      postsPerPage: 12,
      siteDescription: 'Desc',
    });
  });

  it('calls db-backed getSettings', async () => {
    await getBlogSiteSettings();
    expect(mockGetSettings).toHaveBeenCalledOnce();
  });
});
