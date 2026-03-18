import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  await dbConnect();
  const posts = await Post.find({ status: 'published' })
    .select('slug category updatedAt publishedAt')
    .lean();

  // Home page
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // Individual post pages
  for (const post of posts) {
    routes.push({
      url: `${siteUrl}/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // Category pages (deduplicated)
  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))];
  for (const category of categories) {
    routes.push({
      url: `${siteUrl}/category/${encodeURIComponent(category.toLowerCase())}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  return routes;
}
