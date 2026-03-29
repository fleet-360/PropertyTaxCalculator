/**
 * Public blog URL paths (App Router: src/app/(public)/blog).
 * Use these constants and helpers so links, pagination, and SEO stay in sync.
 */
export const BLOG_PATHS = {
  home: '/blog',
  categoryBase: '/blog/category',
} as const;

export function blogPostPath(slug: string): string {
  return `${BLOG_PATHS.home}/${encodeURIComponent(slug)}`;
}

/** Category segment in the URL (lowercased label, encoded). */
export function blogCategoryPath(categoryLabel: string): string {
  return `${BLOG_PATHS.categoryBase}/${encodeURIComponent(categoryLabel.toLowerCase())}`;
}
