// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ShareButtons from '@/components/blog/ShareButtons';

const theme = createTheme({ direction: 'rtl' });

function renderShare() {
  return render(
    <ThemeProvider theme={theme}>
      <ShareButtons title="מאמר בדיקה" slug="test-slug" />
    </ThemeProvider>
  );
}

describe('ShareButtons', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null);
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      href: 'https://site.test/blog/test-slug',
    } as Location);
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders section title', () => {
    renderShare();
    expect(screen.getByText('שתף מאמר זה')).toBeInTheDocument();
  });

  it('opens Twitter intent with title and url', async () => {
    renderShare();
    await user.click(screen.getByRole('button', { name: 'שתף בטוויטר' }));
    expect(window.open).toHaveBeenCalled();
    const url = vi.mocked(window.open).mock.calls[0][0] as string;
    expect(url).toContain('twitter.com/intent/tweet');
    expect(url).toContain(encodeURIComponent('מאמר בדיקה'));
    expect(url).toContain(encodeURIComponent('https://site.test/blog/test-slug'));
  });

  it('opens Facebook sharer with current url', async () => {
    renderShare();
    await user.click(screen.getByRole('button', { name: 'שתף בפייסבוק' }));
    const url = vi.mocked(window.open).mock.calls[0][0] as string;
    expect(url).toContain('facebook.com/sharer');
    expect(url).toContain(encodeURIComponent('https://site.test/blog/test-slug'));
  });

  it('copy shows snackbar message', async () => {
    renderShare();
    await user.click(screen.getByRole('button', { name: 'העתק קישור' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://site.test/blog/test-slug'
    );
    expect(await screen.findByText('הקישור הועתק ללוח')).toBeInTheDocument();
  });
});
