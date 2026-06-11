import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import CityTariff from '@/lib/models/CityTariff';
import Lead from '@/lib/models/Lead';
import PaymentOrder from '@/lib/models/PaymentOrder';
import Coupon from '@/lib/models/Coupon';
import Post from '@/lib/models/Post';
import SystemConfig from '@/lib/models/SystemConfig';
import Settings from '@/lib/models/Settings';
import AiPrompt from '@/lib/models/AiPrompt';
import { requireAdminSession } from '@/lib/admin/requireAdminSession';
import type {
  CitySummary,
  LeadCalculationPaymentOrderView,
  LeadListItem,
} from '@/lib/types/admin';
import type { ICouponData } from '@/lib/types/coupon';
import type { IAiPromptData } from '@/lib/types/ai-prompt';
import type { IAppealLetterSampleSlotView } from '@/lib/types/appeal-letter-sample';
import type { PostListItem, PostSortField, SortDirection } from '@/lib/types/post';
import {
  DEFAULT_MATCH_TOLERANCE_IS_PERCENT,
  DEFAULT_MATCH_TOLERANCE_VALUE,
  type ISystemConfigData,
} from '@/lib/types/system-config';
import {
  buildAppealSampleSlotViews,
  getStoredAppealLetterSamples,
} from '@/lib/appeal/appealLetterSamplesConfig';
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


export async function loadSystemConfigForPublic(): Promise<Partial<ISystemConfigData> | null> {
  await dbConnect();
  const data = await SystemConfig.getConfig();
  if (!data) return null;
  const config = {
    contactEmails: {
      noreply: data.contactEmails?.noreply || '',
      calculator: data.contactEmails?.calculator || '',
      service: data.contactEmails?.service || '',
    },
  };
  return JSON.parse(JSON.stringify(config)) as Partial<ISystemConfigData>;
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
    matchToleranceValue: data.matchToleranceValue ?? DEFAULT_MATCH_TOLERANCE_VALUE,
    matchToleranceIsPercent: data.matchToleranceIsPercent ?? DEFAULT_MATCH_TOLERANCE_IS_PERCENT,
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

function paymentOrdersKey(leadId: string, calculationIndex: number): string {
  return `${leadId}:${calculationIndex}`;
}

function mapPaymentOrderRow(order: {
  product: 'calculator' | 'appeal';
  status: 'pending' | 'paid' | 'failed';
  amountNis: number;
  couponCode?: string;
  tranzilaTransactionId?: string;
  orderId: string;
  createdAt?: Date;
  updatedAt?: Date;
}): LeadCalculationPaymentOrderView {
  return {
    product: order.product,
    status: order.status,
    amountNis: order.amountNis,
    couponCode: order.couponCode || undefined,
    transactionId: order.tranzilaTransactionId || order.orderId,
    date: toIso(order.status === 'paid' ? order.updatedAt ?? order.createdAt : order.createdAt),
  };
}

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

  const leadIds = leads.map((l) => l._id);
  const paymentOrdersByCalc = new Map<string, LeadCalculationPaymentOrderView[]>();

  if (leadIds.length > 0) {
    const orders = await PaymentOrder.find({ leadId: { $in: leadIds } })
      .sort({ createdAt: 1 })
      .lean();

    for (const order of orders) {
      const key = paymentOrdersKey(String(order.leadId), order.calculationIndex);
      const row = mapPaymentOrderRow(order);
      const existing = paymentOrdersByCalc.get(key) ?? [];
      existing.push(row);
      paymentOrdersByCalc.set(key, existing);
    }
  }

  const totalPages = Math.ceil(total / limit);

  const mapped: LeadListItem[] = leads.map((l) => {
    const leadId = String(l._id);
    return {
      _id: leadId,
      fullName: l.fullName,
      phone: l.phone,
      email: l.email,
      idNumber: l.idNumber,
      source: l.source,
      status: l.status,
      message: l.message,
      paymentStatus: l.paymentStatus,
      calculations: (l.calculations || []).map((c, calcIndex) => {
        // Deep-serialize to plain object — strips Mongoose ObjectId buffers
        const plain = JSON.parse(JSON.stringify(c));
        delete plain._id;
        return {
          ...plain,
          createdAt: c.createdAt ? toIso(c.createdAt) : new Date().toISOString(),
          paymentOrders: paymentOrdersByCalc.get(paymentOrdersKey(leadId, calcIndex)) ?? [],
        };
      }),
      createdAt: toIso(l.createdAt),
      updatedAt: toIso(l.updatedAt),
    };
  });

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

// ── AI Prompts ──────────────────────────────────────────────────────

export async function loadAiPromptsAdmin(): Promise<IAiPromptData[]> {
  await requireAdminSession();
  await dbConnect();

  const prompts = await AiPrompt.find().sort({ category: 1, key: 1 }).lean();

  return prompts.map((p) => ({
    _id: String(p._id),
    key: p.key,
    category: p.category,
    label: p.label,
    description: p.description,
    content: p.content,
    templateVariables: p.templateVariables,
    isActive: p.isActive,
    version: p.version,
    lastModifiedBy: p.lastModifiedBy,
    updatedAt: toIso(p.updatedAt),
  }));
}

export async function loadAppealSamplesAdmin(): Promise<IAppealLetterSampleSlotView[]> {
  await requireAdminSession();
  const samples = await getStoredAppealLetterSamples();
  return buildAppealSampleSlotViews(samples);
}
