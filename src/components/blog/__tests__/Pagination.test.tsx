// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Pagination from '@/components/blog/Pagination';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: React.PropsWithChildren<{ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const theme = createTheme({ direction: 'rtl' });

function renderPag(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('Pagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = renderPag(
      <Pagination currentPage={1} totalPages={1} basePath="/blog" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nav with Hebrew label', () => {
    renderPag(<Pagination currentPage={1} totalPages={3} basePath="/blog" />);
    expect(screen.getByRole('navigation', { name: 'ניווט עמודים' })).toBeInTheDocument();
  });

  it('uses basePath for page 1 and ?page= for page 2+', () => {
    renderPag(<Pagination currentPage={1} totalPages={3} basePath="/blog" />);
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    // Current page "1" is a span, not a link; other pages link with query string.
    expect(hrefs.some((h) => h === '/blog?page=2')).toBe(true);
    expect(hrefs.some((h) => h === '/blog?page=3')).toBe(true);
  });

  it('category basePath: page 1 is bare path; neighbors use ?page=', () => {
    const base = '/blog/category/news';
    renderPag(<Pagination currentPage={2} totalPages={4} basePath={base} />);
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(base);
    expect(hrefs).toContain(`${base}?page=3`);
    expect(hrefs).toContain(`${base}?page=4`);
  });
});
