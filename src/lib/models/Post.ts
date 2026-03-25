import mongoose, { Schema, Document, Model } from 'mongoose';
import slugify from 'slugify';
import type { IBlock, ISeo, IContent, PostStatus } from '@/lib/types/post';

// Re-export shared types so existing consumers don't break
export type { IBlock, ISeo, IContent } from '@/lib/types/post';

// ── Post document interface ───────────────────────────────────────────
export interface IPost extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  content: IContent;
  featuredImage?: string;
  author: string;
  category: string;
  tags: string[];
  status: PostStatus;
  publishedAt?: Date;
  seo: ISeo;
  createdAt: Date;
  updatedAt: Date;
}

// ── Block schema ──────────────────────────────────────────────────────
const BlockSchema = new Schema<IBlock>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    order: { type: Number, required: true },
  },
  { _id: false }
);

// ── SEO schema ────────────────────────────────────────────────────────
const SeoSchema = new Schema<ISeo>(
  {
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: [{ type: String }],
    canonicalUrl: { type: String },
    ogTitle: { type: String },
    ogDescription: { type: String },
    ogImage: { type: String },
    twitterCard: {
      type: String,
      enum: ['summary', 'summary_large_image'],
      default: 'summary_large_image',
    },
    noIndex: { type: Boolean, default: false },
    noFollow: { type: Boolean, default: false },
    jsonLd: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

// ── Content schema ────────────────────────────────────────────────────
const ContentSchema = new Schema<IContent>(
  {
    blocks: { type: [BlockSchema], default: [] },
    rawHtml: { type: String },
  },
  { _id: false }
);

// ── Post schema ───────────────────────────────────────────────────────
const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    content: {
      type: ContentSchema,
      default: { blocks: [], rawHtml: '' },
    },
    featuredImage: {
      type: String,
    },
    author: {
      type: String,
      default: 'Admin',
      trim: true,
    },
    category: {
      type: String,
      default: 'Uncategorized',
      trim: true,
    },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
    seo: {
      type: SeoSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────
PostSchema.index({ status: 1 });
PostSchema.index({ category: 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ createdAt: -1 });

// ── Pre-save hook: auto-generate slug from title ──────────────────────
PostSchema.pre('save', function () {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

  // Automatically set publishedAt when status changes to 'published'
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

// ── Model export (handle hot-reload in Next.js dev) ───────────────────
const Post: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
