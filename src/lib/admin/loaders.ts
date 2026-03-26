import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import CityTariff from '@/lib/models/CityTariff';
import Lead from '@/lib/models/Lead';
import Coupon from '@/lib/models/Coupon';
import Post from '@/lib/models/Post';
import SystemConfig from '@/lib/models/SystemConfig';
import Settings from '@/lib/models/Settings';
import { requireAdminSession } from '@/lib/admin/requireAdminSession';
import type { CitySummary, LeadListItem } from '@/lib/types/admin';
import type { ICouponData } from '@/lib/types/coupon';
import type { PostListItem, PostSortField, SortDirection } from '@/lib/types/post';
import type { ISystemConfigData } from '@/lib/types/system-config';
import type { ISettingsData } from '@/lib/types/settings';

function toIso(d: unknown): string {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') return d;
  return new Date(String(d)).toISOString();
}

export async function loadCitiesAdminSummaries(): Promise<CitySummary[]> {
  await requireAdminSession();
  await dbConnect();

  const cities = await CityTariff.find()
    .select('cityName cityNameEn slug year isActive ordinanceUrl availableZones types createdAt updatedAt')
    .sort({ cityName: 1 })
    .lean();

  return cities.map((city) => ({
    _id: String(city._id),
    cityName: city.cityName,
    cityNameEn: city.cityNameEn,
    slug: city.slug,
    year: city.year,
    isActive: city.isActive,
    ordinanceUrl: city.ordinanceUrl,
    zonesCount: city.availableZones?.length || 0,
    typesCount: city.types?.length || 0,
    createdAt: toIso(city.createdAt),
    updatedAt: toIso(city.updatedAt),
  }));
}

export async function loadCouponsAdmin(): Promise<ICouponData[]> {
  await requireAdminSession();
  await dbConnect();

  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();

  return coupons.map((c) => ({
    _id: String(c._id),
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue,
    isOneTimeUse: c.isOneTimeUse,
    usedBy: c.usedBy ? String(c.usedBy) : undefined,
    usedAt: c.usedAt ? toIso(c.usedAt) : undefined,
    isActive: c.isActive,
    expiresAt: c.expiresAt ? toIso(c.expiresAt) : undefined,
    createdAt: toIso(c.createdAt),
    updatedAt: toIso(c.updatedAt),
  }));
}

export async function loadSystemConfigForAdmin(): Promise<ISystemConfigData> {
  await requireAdminSession();
  await dbConnect();
  const data = await SystemConfig.getConfig();

  return {
    _id: String(data._id),
    paymentEnabled: Boolean(data.paymentEnabled),
    systemEnabled: Boolean(data.systemEnabled),
    calculatorPrice: data.calculatorPrice,
    appealPrice: data.appealPrice,
    contactEmails: {
      service: data.contactEmails?.service || '',
      noreply: data.contactEmails?.noreply || '',
      calculator: data.contactEmails?.calculator || '',
    },
  };
}

export async function loadSettingsForAdmin(): Promise<ISettingsData> {
  await requireAdminSession();
  await dbConnect();
  const data = await Settings.getSettings();

  return {
    siteName: data.siteName || '',
    siteDescription: data.siteDescription || '',
    defaultAuthor: data.defaultAuthor || '',
    postsPerPage: data.postsPerPage || 10,
    defaultOgImage: data.defaultOgImage || '',
    googleAnalyticsId: data.googleAnalyticsId || '',
    customHeadCode: data.customHeadCode || '',
    customCss: data.customCss || '',
  };
}

export async function loadCityTariffForEditor(
  id: string
): Promise<Record<string, unknown> | null> {
  await requireAdminSession();
  await dbConnect();

  let city;
  if (mongoose.Types.ObjectId.isValid(id)) {
    city = await CityTariff.findById(id).lean();
  }
  if (!city) {
    city = await CityTariff.findOne({ slug: id }).lean();
  }
  if (!city) return null;

  return JSON.parse(JSON.stringify(city)) as Record<string, unknown>;
}

export async function loadPostLeanForEditor(id: string): Promise<Record<string, unknown> | null> {
  await requireAdminSession();
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const post = await Post.findById(id).lean();
  if (!post) return null;

  return JSON.parse(JSON.stringify(post)) as Record<string, unknown>;
}

// ── Leads (unified customers + contacts) ─────────────────────────────

export type LeadsAdminListResult = {
  leads: LeadListItem[];
  total: number;
  page: number;
  totalPages: number;
};

export async function loadLeadsAdminList(opts: {
  page: number;
  limit: number;
  search: string;
  status: string;
  source: string;
  abandonmentStage: string;
  city: string;
}): Promise<LeadsAdminListResult> {
  await requireAdminSession();
  await dbConnect();

  const page = Math.max(1, opts.page);
  const limit = Math.max(1, Math.min(100, opts.limit));
  const filter: Record<string, unknown> = {};

  if (opts.status) {
    filter.status = opts.status;
  }
  if (opts.source) {
    filter.source = opts.source;
  }
  if (opts.abandonmentStage) {
    filter['calculations.abandonmentStage'] = opts.abandonmentStage;
  }
  if (opts.city) {
    filter['calculations.citySlug'] = opts.city;
  }
  if (opts.search) {
    filter.$or = [
      { fullName: { $regex: opts.search, $options: 'i' } },
      { idNumber: { $regex: opts.search, $options: 'i' } },
      { email: { $regex: opts.search, $options: 'i' } },
      { phone: { $regex: opts.search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  const mapped: LeadListItem[] = leads.map((l) => ({
    _id: String(l._id),
    fullName: l.fullName,
    phone: l.phone,
    email: l.email,
    idNumber: l.idNumber,
    source: l.source,
    status: l.status,
    message: l.message,
    paymentStatus: l.paymentStatus,
    calculations: (l.calculations || []).map((c) => {
      // Deep-serialize to plain object — strips Mongoose ObjectId buffers
      const plain = JSON.parse(JSON.stringify(c));
      delete plain._id;
      return {
        ...plain,
        createdAt: c.createdAt ? toIso(c.createdAt) : new Date().toISOString(),
      };
    }),
    createdAt: toIso(l.createdAt),
    updatedAt: toIso(l.updatedAt),
  }));

  return { leads: mapped, total, page, totalPages };
}

// ── Posts ─────────────────────────────────────────────────────────────

const POST_SORT_FIELDS: PostSortField[] = [
  'title',
  'status',
  'category',
  'author',
  'createdAt',
];

function normalizePostSortField(field: string): PostSortField {
  return POST_SORT_FIELDS.includes(field as PostSortField)
    ? (field as PostSortField)
    : 'createdAt';
}

export type PostsAdminListResult = {
  posts: PostListItem[];
  total: number;
  page: number;
  totalPages: number;
};

export async function loadPostsAdminList(opts: {
  page: number;
  limit: number;
  search: string;
  status: string;
  category: string;
  sortField: string;
  sortDirection: SortDirection;
}): Promise<PostsAdminListResult> {
  await requireAdminSession();
  await dbConnect();

  const page = Math.max(1, opts.page);
  const limit = Math.max(1, Math.min(100, opts.limit));
  const filter: Record<string, unknown> = {};

  if (opts.search) {
    filter.title = { $regex: opts.search, $options: 'i' };
  }
  if (opts.status) {
    filter.status = opts.status;
  }
  if (opts.category) {
    filter.category = opts.category;
  }

  const sortField = normalizePostSortField(opts.sortField);
  const sortObj: Record<string, 1 | -1> = {};
  if (opts.sortDirection === 'desc') {
    sortObj[sortField] = -1;
  } else {
    sortObj[sortField] = 1;
  }

  const skip = (page - 1) * limit;

  const [rawPosts, total] = await Promise.all([
    Post.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
    Post.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  const posts: PostListItem[] = rawPosts.map((p) => ({
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    status: p.status,
    category: p.category,
    author: p.author,
    createdAt: toIso(p.createdAt),
    updatedAt: toIso(p.updatedAt),
  }));

  return { posts, total, page, totalPages };
}

export async function loadPostCategoriesDistinct(): Promise<string[]> {
  await requireAdminSession();
  await dbConnect();
  const cats = await Post.distinct('category');
  return [...new Set(cats.filter(Boolean) as string[])].sort();
}
