import { describe, it, expect } from 'vitest';
import { generateJsonLd } from '@/lib/seo';
import type { IPost } from '@/lib/models/Post';

function minimalPost(overrides: Partial<IPost> = {}): IPost {
  return {
    title: 'Post',
    slug: 'my-post',
    author: 'Author',
    seo: {} as IPost['seo'],
    content: { blocks: [] },
    tags: [],
    category: 'General',
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as IPost;
}

describe('generateJsonLd', () => {
  it('includes /blog/ in post url', () => {
    const json = generateJsonLd(minimalPost({ slug: 'hello' }), 'https://example.com');
    expect(json.url).toBe('https://example.com/blog/hello');
    expect(json.mainEntityOfPage['@id']).toBe('https://example.com/blog/hello');
  });

  it('strips trailing slash from site base', () => {
    const json = generateJsonLd(minimalPost({ slug: 'x' }), 'https://example.com/');
    expect(json.url).toBe('https://example.com/blog/x');
  });

  it('encodes slug in path', () => {
    const json = generateJsonLd(minimalPost({ slug: 'a b' }), 'https://x.test');
    expect(json.url).toBe('https://x.test/blog/a%20b');
  });
});
