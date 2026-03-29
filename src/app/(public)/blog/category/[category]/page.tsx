
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MuiLink from '@mui/material/Link';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { BLOG_PATHS, blogCategoryPath } from '@/lib/blog/routes';
import { getBlogSiteSettings } from '@/lib/blog/settings';
import PostCard from '@/components/blog/PostCard';
import Pagination from '@/components/blog/Pagination';

async function getPostsByCategory(category: string, page: number, perPage: number) {
  await dbConnect();
  const skip = (page - 1) * perPage;

  // Case-insensitive match for category
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

  // Get the actual category name with original casing from the first post
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
  const siteName = settings.siteName || 'Blog';

  // Capitalize first letter
  const displayCategory = decodedCategory.charAt(0).toUpperCase() + decodedCategory.slice(1);

  return {
    title: `${displayCategory} - ${siteName}`,
    description: `Browse all posts in the ${displayCategory} category on ${siteName}.`,
    openGraph: {
      title: `${displayCategory} - ${siteName}`,
      description: `Browse all posts in the ${displayCategory} category.`,
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
  const perPage = settings.postsPerPage || 10;
  const { posts, totalCount, totalPages, categoryName } = await getPostsByCategory(
    decodedCategory,
    currentPage,
    perPage
  );

  if (posts.length === 0 && currentPage === 1) {
    notFound();
  }

  const displayCategory =
    categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

  return (
    <>
      {/* Category Header */}
      <Box
        component="section"
        sx={{
          py: { xs: 4, md: 6 },
          backgroundColor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          {/* Breadcrumbs */}
          <Breadcrumbs
            aria-label="Breadcrumb"
            sx={{ mb: 2, fontSize: '0.85rem' }}
            separator={
              <Typography
                component="span"
                sx={{ color: 'text.secondary', mx: 0.5 }}
              >
                /
              </Typography>
            }
          >
            <MuiLink
              component={"a"}
              href="/"
              underline="hover"
              sx={{ fontSize: '0.85rem', color: 'primary.main' }}
            >
              דף הבית
            </MuiLink>
            <MuiLink
              component={"a"}
              href={BLOG_PATHS.home}
              underline="hover"
              sx={{ fontSize: '0.85rem', color: 'text.secondary' }}
            >
              כל הכתבות
            </MuiLink>
            <Typography
              component="span"
              sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.85rem' }}
            >
              {displayCategory}
            </Typography>
          </Breadcrumbs>

          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.8rem', md: '2.5rem' },
              color: 'text.primary',
              letterSpacing: '-0.02em',
            }}
          >
            {displayCategory}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            {totalCount === 1 ? 'כתבה אחת' : `${totalCount} כתבות`} בקטגוריה זו
          </Typography>
        </Container>
      </Box>

      {/* Posts Grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={4}>
          {posts.map((post: any) => (
            <Grid size={{ xs: 12, md: 6 }} key={post._id}>
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
            Showing {(currentPage - 1) * perPage + 1}&ndash;
            {Math.min(currentPage * perPage, totalCount)} of {totalCount} posts
          </Typography>
        )}
      </Container>
    </>
  );
}
