// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TableOfContents from '@/components/blog/TableOfContents';

const theme = createTheme({ direction: 'rtl' });

function renderToc(blocks: Parameters<typeof TableOfContents>[0]['blocks']) {
  return render(
    <ThemeProvider theme={theme}>
      <TableOfContents blocks={blocks} />
    </ThemeProvider>
  );
}

describe('TableOfContents', () => {
  beforeEach(() => {
    vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when fewer than two headings', () => {
    const { container: empty } = renderToc([]);
    expect(empty.firstChild).toBeNull();

    const { container: one } = renderToc([
      { id: '1', type: 'heading', data: { text: '1', level: 'h2' }, order: 0 },
    ]);
    expect(one.firstChild).toBeNull();
  });

  it('renders nav and heading links when two or more headings exist', () => {
    renderToc([
      { id: 'a', type: 'heading', data: { text: '1', level: 'h2' }, order: 0 },
      { id: 'b', type: 'heading', data: { text: '2', level: 'h3' }, order: 1 },
    ]);
    expect(screen.getByRole('navigation', { name: 'תוכן עניינים' })).toBeInTheDocument();
    expect(screen.getByText('בעמוד זה')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute('href', '#1');
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('href', '#2');
  });

  it('on click scrolls to element and updates hash', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);

    const fakeEl = {
      getBoundingClientRect: () => ({ top: 400 }),
    } as HTMLElement;
    vi.spyOn(document, 'getElementById').mockReturnValue(fakeEl);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 100 });

    renderToc([
      { id: 'a', type: 'heading', data: { text: '1', level: 'h2' }, order: 0 },
      { id: 'b', type: 'heading', data: { text: '2', level: 'h2' }, order: 1 },
    ]);

    fireEvent.click(screen.getByRole('link', { name: '1' }));

    expect(scrollTo).toHaveBeenCalledWith({
      top: 400 + 100 - 100,
      behavior: 'smooth',
    });
    expect(window.history.pushState).toHaveBeenCalledWith(null, '', '#1');

    vi.unstubAllGlobals();
  });
});
