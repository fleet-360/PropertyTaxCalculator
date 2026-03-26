import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import CityTariff from '@/lib/models/CityTariff';
import Coupon from '@/lib/models/Coupon';
import Lead from '@/lib/models/Lead';
import SystemConfig from '@/lib/models/SystemConfig';
import type { PostListItem } from '@/lib/types/post';
import { requireAdminSession } from '@/lib/admin/requireAdminSession';

export type DashboardStats = {
  total: number;
  published: number;
  cities: number;
  activeCoupons: number;
  totalLeads: number;
  newLeads: number;
  systemEnabled: boolean;
  paymentEnabled: boolean;
};

function toIso(d: unknown): string {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') return d;
  return new Date(String(d)).toISOString();
}

function toPostListItem(doc: {
  _id: unknown;
  title: string;
  slug?: string;
  excerpt?: string;
  status: string;
  category: string;
  author: string;
  createdAt: unknown;
  updatedAt: unknown;
}): PostListItem {
  return {
    _id: String(doc._id),
    title: doc.title,
    slug: doc.slug ?? '',
    excerpt: doc.excerpt,
    status: doc.status as PostListItem['status'],
    category: doc.category,
    author: doc.author,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export async function getAdminDashboardData(): Promise<{
  posts: PostListItem[];
  stats: DashboardStats;
}> {
  await requireAdminSession();
  await dbConnect();

  const [
    recentPostsRaw,
    totalPosts,
    publishedPosts,
    citiesCount,
    activeCoupons,
    totalLeads,
    newLeads,
    config,
  ] = await Promise.all([
    Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status category author createdAt updatedAt excerpt slug')
      .lean(),
    Post.countDocuments(),
    Post.countDocuments({ status: 'published' }),
    CityTariff.countDocuments(),
    Coupon.countDocuments({ isActive: true }),
    Lead.countDocuments(),
    Lead.countDocuments({ status: 'new' }),
    SystemConfig.getConfig(),
  ]);

  const posts = recentPostsRaw.map((p) =>
    toPostListItem(p as Parameters<typeof toPostListItem>[0])
  );

  return {
    posts,
    stats: {
      total: totalPosts,
      published: publishedPosts,
      cities: citiesCount,
      activeCoupons,
      totalLeads,
      newLeads,
      systemEnabled: Boolean(config.systemEnabled),
      paymentEnabled: Boolean(config.paymentEnabled),
    },
  };
}
