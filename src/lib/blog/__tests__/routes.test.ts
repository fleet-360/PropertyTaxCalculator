import { describe, it, expect } from 'vitest';
import { BLOG_PATHS, blogPostPath, blogCategoryPath } from '@/lib/blog/routes';

describe('BLOG_PATHS', () => {
  it('uses stable blog base paths', () => {
    expect(BLOG_PATHS.home).toBe('/blog');
    expect(BLOG_PATHS.categoryBase).toBe('/blog/category');
  });
});

describe('blogPostPath', () => {
  it('builds path under /blog', () => {
    expect(blogPostPath('hello-world')).toBe('/blog/hello-world');
  });

  it('encodes slug segments', () => {
    expect(blogPostPath('a b')).toBe('/blog/a%20b');
  });
});

describe('blogCategoryPath', () => {
  it('lowercases and encodes category label', () => {
    expect(blogCategoryPath('Tax Tips')).toBe('/blog/category/tax%20tips');
  });

  it('handles Hebrew labels', () => {
    expect(blogCategoryPath('מגורים')).toBe(
      `/blog/category/${encodeURIComponent('מגורים')}`
    );
  });
});
