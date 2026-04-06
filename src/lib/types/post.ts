/**
 * Shared plain-data interfaces for the Post / Blog domain.
 *
 * These are the single source of truth for post structures.
 * The Mongoose model (`src/lib/models/Post.ts`) and all consumers
 * import from here.
 */

import type { BlockData } from '@/components/editor/types';

// ── Block sub-document interface (DB-level) ─────────────────────────
export interface IBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
  order: number;
}

// ── SEO sub-document interface ──────────────────────────────────────
export interface ISeo {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
  noFollow?: boolean;
  jsonLd?: unknown;
}

// ── Content sub-document interface ──────────────────────────────────
export interface IContent {
  blocks: IBlock[];
  rawHtml?: string;
}

// ── Post status type ────────────────────────────────────────────────
export type PostStatus = 'draft' | 'published' | 'archived';

// ── SEO data for editor forms (all fields required for form state) ──
export interface SeoData {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: 'summary' | 'summary_large_image';
  noIndex: boolean;
  noFollow: boolean;
  jsonLd?: unknown;
}

// ── Post data for editor forms ──────────────────────────────────────
export interface PostData {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: {
    blocks: BlockData[];
    rawHtml: string;
  };
  featuredImage: string;
  author: string;
  category: string;
  tags: string[];
  status: PostStatus;
  publishedAt: string;
  seo: SeoData;
}

// ── Post list item (API response shape for admin lists) ─────────────
export interface PostListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: PostStatus;
  category: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

// ── Paginated posts response ────────────────────────────────────────
export interface PostsResponse {
  posts: PostListItem[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// ── SEO check result ────────────────────────────────────────────────
export interface SeoCheck {
  type: 'success' | 'warning' | 'error';
  message: string;
}

// ── Post editor props ───────────────────────────────────────────────
export interface PostEditorProps {
  initialData?: Partial<PostData> | null;
  onSave: (data: PostData) => Promise<void>;
  isNew: boolean;
}

// ── Sort types for post lists ───────────────────────────────────────
export type PostSortField = 'title' | 'status' | 'category' | 'author' | 'createdAt';
export type SortDirection = 'asc' | 'desc';
