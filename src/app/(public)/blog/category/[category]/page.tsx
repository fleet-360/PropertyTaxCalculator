import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { BLOG_PATHS, blogCategoryPath } from '@/lib/blog/routes';
import { getBlogSiteSettings } from '@/lib/blog/settings';
import PostCard from '@/components/blog/PostCard';
import Pagination from '@/components/blog/Pagination';
import PageHero from '@/components/common/PageHero';
import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';

async function getPostsByCategory(category: string, page: number, perPage: number) {
  await dbConnect();
  const skip = (page - 1) * perPage;

  const filter = {
    status: 'published' as const,
    category: { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  };

  const [posts, totalCount] = await Promise.all([
    Post.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(perPage)
      .lean(),
    Post.countDocuments(filter),
  ]);

  const actualCategory = posts.length > 0 ? posts[0].category : category;

  return {
    posts: JSON.parse(JSON.stringify(posts)),
    totalCount,
    totalPages: Math.ceil(totalCount / perPage),
    categoryName: actualCategory,
  };
}

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const settings = await getBlogSiteSettings();
  const siteName = settings.siteName || 'מחשבון ארנונה';

  const displayCategory = decodedCategory.charAt(0).toUpperCase() + decodedCategory.slice(1);

  return {
    title: `${displayCategory} | ${siteName}`,
    description: `כל הכתבות בקטגוריית ${displayCategory}.`,
    openGraph: {
      title: `${displayCategory} | ${siteName}`,
      description: `כל הכתבות בקטגוריית ${displayCategory}.`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;
  const decodedCategory = decodeURIComponent(category);
  const settings = await getBlogSiteSettings();
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10) || 1);
  const perPage = settings.postsPerPage || 9;
  const { posts, totalCount, totalPages, categoryName } = await getPostsByCategory(
    decodedCategory,
    currentPage,
    perPage,
  );

  if (posts.length === 0 && currentPage === 1) {
    notFound();
  }

  const displayCategory =
    categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

  return (
    <>
      <PageHero
        title={displayCategory}
        subtitle={totalCount === 1 ? 'כתבה אחת בקטגוריה זו' : `${totalCount} כתבות בקטגוריה זו`}
      />
      <PageBreadcrumbs
        items={[
          { label: 'בית', href: '/' },
          { label: 'חשוב לדעת', href: BLOG_PATHS.home },
          { label: displayCategory },
        ]}
      />

      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 }, pt: { xs: 1, md: 2 } }}>
        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {posts.map((post: any) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={post._id}>
              <PostCard post={post} />
            </Grid>
          ))}
        </Grid>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={blogCategoryPath(decodedCategory)}
        />

        {totalCount > 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 2 }}
          >
            מציג {(currentPage - 1) * perPage + 1}&ndash;
            {Math.min(currentPage * perPage, totalCount)} מתוך {totalCount} כתבות
          </Typography>
        )}
      </Container>
    </>
  );
}
