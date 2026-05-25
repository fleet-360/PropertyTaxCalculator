import type { Metadata } from 'next';
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
import PageHero from '@/components/common/PageHero';
import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
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
    title: settings.siteName || 'חשוב לדעת | מחשבון ארנונה',
    description: settings.siteDescription || 'כל מה שרציתם לדעת על הארנונה במקום אחד',
    openGraph: {
      title: settings.siteName || 'חשוב לדעת',
      description: settings.siteDescription || 'כל מה שרציתם לדעת על הארנונה במקום אחד',
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
  const perPage = settings.postsPerPage || 9;
  const { posts, totalCount, totalPages } = await getPosts(currentPage, perPage);

  return (
    <>
      <PageHero title="חשוב לדעת" />
      <PageBreadcrumbs
        items={[
          { label: 'בית', href: '/' },
          { label: 'חשוב לדעת' },
        ]}
      />

      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 }, pt: { xs: 1, md: 2 } }}>
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
              basePath={BLOG_PATHS.home}
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
          </>
        )}
      </Container>
    </>
  );
}
