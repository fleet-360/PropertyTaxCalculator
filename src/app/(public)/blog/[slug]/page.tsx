import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { BLOG_PATHS } from '@/lib/blog/routes';
import { generatePostMetadata, generateJsonLd } from '@/lib/seo';
import PageHero from '@/components/common/PageHero';
import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import PostArticle from '@/components/blog/PostArticle';

async function getPost(slug: string) {
  await dbConnect();
  const post = await Post.findOne({ slug, status: 'published' }).lean();
  if (!post) return null;
  return JSON.parse(JSON.stringify(post));
}

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return { title: 'Post Not Found' };
  }
  return generatePostMetadata(post);
}

export async function generateStaticParams() {
  await dbConnect();
  const posts = await Post.find({ status: 'published' }).select('slug').lean();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const jsonLd = generateJsonLd(post, siteUrl);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero title={post.title} />
      <PageBreadcrumbs
        items={[
          { label: 'בית', href: '/' },
          { label: 'חשוב לדעת', href: BLOG_PATHS.home },
          { label: post.title },
        ]}
      />

      <PostArticle post={post} />
    </>
  );
}
