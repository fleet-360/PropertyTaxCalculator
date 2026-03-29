import type { Metadata } from 'next';
import { blogPostPath } from '@/lib/blog/routes';
import type { IPost } from './models/Post';

function toISOString(date: Date | string | undefined | null): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') return new Date(date).toISOString();
  return date.toISOString();
}

// ── SEO validation result ─────────────────────────────────────────────
export interface SeoCheckResult {
  type: 'warning' | 'error' | 'success';
  message: string;
}

// ── JSON-LD BlogPosting type ──────────────────────────────────────────
export interface BlogPostingJsonLd {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description?: string;
  image?: string;
  author: {
    '@type': 'Person';
    name: string;
  };
  datePublished?: string;
  dateModified?: string;
  url: string;
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
  keywords?: string;
}

// ── generatePostMetadata ──────────────────────────────────────────────
// Returns a Next.js Metadata object populated from the post's SEO fields
// and core fields as fallbacks.
export function generatePostMetadata(post: IPost): Metadata {
  const title = post.seo?.metaTitle || post.title;
  const description = post.seo?.metaDescription || post.excerpt || '';
  const ogTitle = post.seo?.ogTitle || title;
  const ogDescription = post.seo?.ogDescription || description;
  const ogImage = post.seo?.ogImage || post.featuredImage;

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      ...(post.publishedAt
        ? { publishedTime: toISOString(post.publishedAt) }
        : {}),
      ...(post.updatedAt
        ? { modifiedTime: toISOString(post.updatedAt) }
        : {}),
      authors: [post.author],
    },
    twitter: {
      card: post.seo?.twitterCard || 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(post.seo?.canonicalUrl
      ? { alternates: { canonical: post.seo.canonicalUrl } }
      : {}),
    robots: {
      index: !post.seo?.noIndex,
      follow: !post.seo?.noFollow,
    },
  };

  return metadata;
}

// ── generateJsonLd ────────────────────────────────────────────────────
// Returns a BlogPosting JSON-LD object suitable for embedding in a
// <script type="application/ld+json"> tag.
export function generateJsonLd(
  post: IPost,
  siteUrl: string
): BlogPostingJsonLd {
  const base = siteUrl.replace(/\/$/, '');
  const postUrl = `${base}${blogPostPath(post.slug)}`;

  const jsonLd: BlogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt || undefined,
    image: post.seo?.ogImage || post.featuredImage || undefined,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    datePublished: toISOString(post.publishedAt),
    dateModified: toISOString(post.updatedAt),
    url: postUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    keywords:
      post.seo?.metaKeywords?.length
        ? post.seo.metaKeywords.join(', ')
        : post.tags?.length
          ? post.tags.join(', ')
          : undefined,
  };

  return jsonLd;
}

// ── validateSeoScore ──────────────────────────────────────────────────
// Analyses a post and returns an array of SEO check results covering
// title length, description length, H1 presence, heading hierarchy,
// image alt attributes, and slug quality.
export function validateSeoScore(post: IPost): SeoCheckResult[] {
  const results: SeoCheckResult[] = [];
  const title = post.seo?.metaTitle || post.title || '';
  const description = post.seo?.metaDescription || post.excerpt || '';

  // ── Title length checks ───────────────────────────────────────────
  if (!title) {
    results.push({ type: 'error', message: 'Title is missing.' });
  } else if (title.length < 30) {
    results.push({
      type: 'warning',
      message: `Title is too short (${title.length} chars). Aim for 30-60 characters.`,
    });
  } else if (title.length > 60) {
    results.push({
      type: 'warning',
      message: `Title is too long (${title.length} chars). Search engines may truncate it after 60 characters.`,
    });
  } else {
    results.push({
      type: 'success',
      message: `Title length is good (${title.length} chars).`,
    });
  }

  // ── Description length checks ─────────────────────────────────────
  if (!description) {
    results.push({
      type: 'error',
      message: 'Meta description is missing.',
    });
  } else if (description.length < 120) {
    results.push({
      type: 'warning',
      message: `Meta description is too short (${description.length} chars). Aim for 120-160 characters.`,
    });
  } else if (description.length > 160) {
    results.push({
      type: 'warning',
      message: `Meta description is too long (${description.length} chars). Search engines may truncate it after 160 characters.`,
    });
  } else {
    results.push({
      type: 'success',
      message: `Meta description length is good (${description.length} chars).`,
    });
  }

  // ── Analyse content blocks for headings and images ────────────────
  const blocks = post.content?.blocks || [];
  const rawHtml = post.content?.rawHtml || '';

  // Collect heading information from blocks
  const headingBlocks = blocks.filter((b) => b.type === 'header' || b.type === 'heading');
  const headingLevels = headingBlocks
    .map((b) => {
      const level = (b.data as Record<string, unknown>)?.level;
      return typeof level === 'number' ? level : null;
    })
    .filter((l): l is number => l !== null);

  // Also check rawHtml for headings
  const htmlHeadingMatches = rawHtml.match(/<h([1-6])[^>]*>/gi) || [];
  const htmlHeadingLevels = htmlHeadingMatches.map((tag) => {
    const match = tag.match(/<h([1-6])/i);
    return match ? parseInt(match[1], 10) : 0;
  });

  const allHeadingLevels = [...headingLevels, ...htmlHeadingLevels];

  // ── H1 presence ───────────────────────────────────────────────────
  const hasH1 = allHeadingLevels.includes(1);
  if (!hasH1) {
    results.push({
      type: 'warning',
      message: 'No H1 heading found in the content. Each page should have exactly one H1.',
    });
  } else {
    const h1Count = allHeadingLevels.filter((l) => l === 1).length;
    if (h1Count > 1) {
      results.push({
        type: 'warning',
        message: `Multiple H1 headings found (${h1Count}). Use only one H1 per page.`,
      });
    } else {
      results.push({
        type: 'success',
        message: 'Page has exactly one H1 heading.',
      });
    }
  }

  // ── Heading hierarchy ─────────────────────────────────────────────
  let hierarchyValid = true;
  for (let i = 1; i < allHeadingLevels.length; i++) {
    if (allHeadingLevels[i] > allHeadingLevels[i - 1] + 1) {
      hierarchyValid = false;
      break;
    }
  }

  if (allHeadingLevels.length > 1) {
    if (hierarchyValid) {
      results.push({
        type: 'success',
        message: 'Heading hierarchy is correct (no skipped levels).',
      });
    } else {
      results.push({
        type: 'warning',
        message: 'Heading hierarchy has skipped levels (e.g. H2 followed by H4). Use sequential heading levels.',
      });
    }
  }

  // ── Image alt attributes ──────────────────────────────────────────
  const imageBlocks = blocks.filter((b) => b.type === 'image');
  const imagesWithoutAlt = imageBlocks.filter((b) => {
    const data = b.data as Record<string, unknown>;
    return !data?.alt && !data?.caption;
  });

  // Also check rawHtml for images without alt
  const htmlImgTags = rawHtml.match(/<img[^>]*>/gi) || [];
  const htmlImgsWithoutAlt = htmlImgTags.filter(
    (tag) => !tag.match(/alt\s*=\s*["'][^"']+["']/i)
  );

  const totalMissingAlt = imagesWithoutAlt.length + htmlImgsWithoutAlt.length;
  const totalImages = imageBlocks.length + htmlImgTags.length;

  if (totalImages > 0 && totalMissingAlt > 0) {
    results.push({
      type: 'warning',
      message: `${totalMissingAlt} of ${totalImages} image(s) are missing alt text. Add descriptive alt attributes for accessibility and SEO.`,
    });
  } else if (totalImages > 0) {
    results.push({
      type: 'success',
      message: `All ${totalImages} image(s) have alt text.`,
    });
  }

  // ── Slug quality ──────────────────────────────────────────────────
  const slug = post.slug || '';
  if (!slug) {
    results.push({ type: 'error', message: 'Slug is missing.' });
  } else {
    // Check for common slug issues
    if (slug.length > 75) {
      results.push({
        type: 'warning',
        message: `Slug is too long (${slug.length} chars). Keep slugs under 75 characters.`,
      });
    } else if (/[A-Z]/.test(slug)) {
      results.push({
        type: 'warning',
        message: 'Slug contains uppercase characters. Use lowercase only for consistency.',
      });
    } else if (/[^a-z0-9-]/.test(slug)) {
      results.push({
        type: 'warning',
        message: 'Slug contains special characters. Use only lowercase letters, numbers, and hyphens.',
      });
    } else if (/--/.test(slug)) {
      results.push({
        type: 'warning',
        message: 'Slug contains consecutive hyphens. Clean up the slug for better readability.',
      });
    } else {
      results.push({
        type: 'success',
        message: 'Slug is well-formatted.',
      });
    }
  }

  return results;
}
