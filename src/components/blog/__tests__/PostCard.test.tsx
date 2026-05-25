// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import PostCard from '@/components/blog/PostCard';
import { blogPostPath, blogCategoryPath } from '@/lib/blog/routes';

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

function renderCard(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const basePost = {
  _id: '1',
  title: 'כותרת בדיקה',
  slug: 'test-slug',
  author: 'מחבר',
  category: 'חדשות',
};

describe('PostCard', () => {
  it('links title and read-more to blog post path', () => {
    renderCard(<PostCard post={basePost} />);
    const titleLink = screen.getByRole('heading', { level: 2 }).querySelector('a');
    expect(titleLink).toHaveAttribute('href', blogPostPath('test-slug'));

    const readMore = screen.getByRole('link', { name: /המשך קריאה/ });
    expect(readMore).toHaveAttribute('href', blogPostPath('test-slug'));
  });

  it('links category chip to category path when not Uncategorized', () => {
    renderCard(<PostCard post={basePost} />);
    const article = screen.getByRole('article');
    const categoryLink = within(article).getByRole('link', { name: /חדשות/ });
    expect(categoryLink).toHaveAttribute('href', blogCategoryPath('חדשות'));
  });

  it('does not render category chip for Uncategorized', () => {
    renderCard(<PostCard post={{ ...basePost, category: 'Uncategorized' }} />);
    const links = screen.getAllByRole('link');
    const categoryHref = links.some((a) => a.getAttribute('href')?.includes('/blog/category/'));
    expect(categoryHref).toBe(false);
  });

  it('renders excerpt and featured image when provided', () => {
    renderCard(
      <PostCard
        post={{
          ...basePost,
          excerpt: 'תקציר קצר',
          featuredImage: 'https://example.com/img.jpg',
        }}
      />
    );
    expect(screen.getByText('תקציר קצר')).toBeInTheDocument();
    const img = screen.getByRole('img', { name: 'כותרת בדיקה' });
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg');
  });
});
