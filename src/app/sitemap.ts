import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { BLOG_PATHS, blogCategoryPath, blogPostPath } from '@/lib/blog/routes';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  await dbConnect();
  const posts = await Post.find({ status: 'published' })
    .select('slug category updatedAt publishedAt')
    .lean();

  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    {
      url: `${siteUrl}/calculator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}${BLOG_PATHS.home}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/testimonials`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  for (const post of posts) {
    routes.push({
      url: `${siteUrl}${blogPostPath(post.slug)}`,
      lastModified: post.updatedAt || post.publishedAt || now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))];
  for (const category of categories) {
    routes.push({
      url: `${siteUrl}${blogCategoryPath(category)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  return routes;
}
