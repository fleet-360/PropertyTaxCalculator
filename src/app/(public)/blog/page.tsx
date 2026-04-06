import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { BLOG_PATHS } from '@/lib/blog/routes';
import { getBlogSiteSettings } from '@/lib/blog/settings';
import PostCard from '@/components/blog/PostCard';
import Pagination from '@/components/blog/Pagination';
import { PostsResponse } from '@/lib/types';

export async function getPosts(page: number, perPage: number): Promise<PostsResponse> {
  await dbConnect();
  const skip = (page - 1) * perPage;
  const [posts, totalCount] = await Promise.all([
    Post.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(perPage)
      .lean(),
    Post.countDocuments({ status: 'published' }),
  ]);
  return {
    posts: JSON.parse(JSON.stringify(posts)),
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / perPage),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBlogSiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  return {
    title: settings.siteName || 'Blog',
    description: settings.siteDescription || 'Welcome to our blog',
    openGraph: {
      title: settings.siteName || 'Blog',
      description: settings.siteDescription || 'Welcome to our blog',
      type: 'website',
      ...(settings.defaultOgImage ? { images: [{ url: settings.defaultOgImage }] } : {}),
    },
    ...(siteUrl ? { alternates: { canonical: siteUrl } } : {}),
  };
}

interface BlogHomeProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogHome({ searchParams }: BlogHomeProps) {
  const params = await searchParams;
  const settings = await getBlogSiteSettings();
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const perPage = settings.postsPerPage || 10;
  const { posts, totalCount, totalPages } = await getPosts(currentPage, perPage);

  return (
    <>
      {/* Hero / Header Section */}
      <Box
        component="section"
        sx={{
          py: { xs: 6, md: 10 },
          textAlign: 'center',
          backgroundColor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '3rem' },
              mb: 2,
              color: 'text.primary',
              letterSpacing: '-0.02em',
            }}
          >
            {settings.siteName || 'My Blog'}
          </Typography>
          {settings.siteDescription && (
            <Typography
              variant="h6"
              component="p"
              sx={{
                color: 'text.secondary',
                fontWeight: 400,
                fontSize: { xs: '1rem', md: '1.2rem' },
                lineHeight: 1.6,
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              {settings.siteDescription}
            </Typography>
          )}
        </Container>
      </Box>

      {/* Posts Grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
              אין כתבות עדיין
            </Typography>
            <Typography variant="body1" color="text.secondary">
              בואו לבדוק מחר לקבל תוכן חדש.
            </Typography>
          </Box>
        ) : (
          <>
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
              basePath={BLOG_PATHS.home}
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
          </>
        )}
      </Container>
    </>
  );
}
