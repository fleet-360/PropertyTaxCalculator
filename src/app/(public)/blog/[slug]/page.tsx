import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import Settings from '@/lib/models/Settings';
import { generatePostMetadata, generateJsonLd } from '@/lib/seo';
import BlockRenderer from '@/components/editor/BlockRenderer';
import ShareButtons from '@/components/blog/ShareButtons';
import TableOfContents from '@/components/blog/TableOfContents';

async function getPost(slug: string) {
  await dbConnect();
  const post = await Post.findOne({ slug, status: 'published' }).lean();
  if (!post) return null;
  return JSON.parse(JSON.stringify(post));
}

async function getSettings() {
  await dbConnect();
  const settings = await Settings.getSettings();
  return JSON.parse(JSON.stringify(settings));
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

function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatISODate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPost(slug), getSettings()]);

  if (!post) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const jsonLd = generateJsonLd(post, siteUrl);
  const blocks = post.content?.blocks || [];
  const hasHeadings = blocks.filter(
    (b: any) => b.type === 'heading' && b.data?.text
  ).length >= 2;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid size={{ xs: 12, md: hasHeadings ? 8 : 12 }}>
            <Box
              component="article"
              itemScope
              itemType="https://schema.org/BlogPosting"
              sx={{ maxWidth: hasHeadings ? '100%' : 800, mx: 'auto' }}
            >
              {/* Article Header */}
              <Box component="header" sx={{ mb: 4 }}>
                {/* Category */}
                {post.category && post.category !== 'Uncategorized' && (
                  <Link
                    href={`/category/${encodeURIComponent(post.category.toLowerCase())}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Chip
                      label={post.category}
                      clickable
                      size="small"
                      sx={{
                        mb: 2,
                        backgroundColor: '#1976d2',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        '&:hover': { backgroundColor: '#1565c0' },
                      }}
                    />
                  </Link>
                )}

                {/* Title */}
                <Typography
                  variant="h1"
                  component="h1"
                  itemProp="headline"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.8rem', md: '2.8rem' },
                    lineHeight: 1.2,
                    mb: 3,
                    color: '#1a1a1a',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {post.title}
                </Typography>

                {/* Meta Info */}
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 2,
                    color: 'text.secondary',
                    fontSize: '0.9rem',
                  }}
                >
                  {/* Author */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: '#1976d2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      {post.author?.charAt(0)?.toUpperCase() || 'A'}
                    </Box>
                    <Typography
                      variant="body2"
                      component="span"
                      itemProp="author"
                      itemScope
                      itemType="https://schema.org/Person"
                      sx={{ fontWeight: 500 }}
                    >
                      <span itemProp="name">{post.author}</span>
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    &middot;
                  </Typography>

                  {/* Date */}
                  {post.publishedAt && (
                    <Typography
                      variant="body2"
                      component="time"
                      dateTime={formatISODate(post.publishedAt)}
                      itemProp="datePublished"
                      content={formatISODate(post.publishedAt)}
                    >
                      {formatDate(post.publishedAt)}
                    </Typography>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        &middot;
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {post.tags.map((tag: string) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: 24,
                              borderColor: 'divider',
                            }}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              </Box>

              {/* Featured Image */}
              {post.featuredImage && (
                <Box
                  component="figure"
                  sx={{
                    m: 0,
                    mb: 4,
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    itemProp="image"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      borderRadius: '12px',
                    }}
                  />
                </Box>
              )}

              {/* Post Content */}
              <Box
                component="section"
                itemProp="articleBody"
                sx={{
                  '& .blog-content': {
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    lineHeight: 1.8,
                  },
                }}
              >
                <BlockRenderer blocks={blocks} />
              </Box>

              <Divider sx={{ my: 5 }} />

              {/* Tags at bottom */}
              {post.tags && post.tags.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: 1,
                    }}
                  >
                    Tagged with
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {post.tags.map((tag: string) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: 'divider',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.05)',
                            borderColor: '#1976d2',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Share Buttons */}
              <ShareButtons title={post.title} slug={post.slug} />

              {/* Back to Home */}
              <Box sx={{ mt: 5, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
                <Link
                  href="/blog"
                  style={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                  }}
                >
                  &larr; חזרה לכל הכתבות
                </Link>
              </Box>
            </Box>
          </Grid>

          {/* Table of Contents Sidebar */}
          {hasHeadings && (
            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{
                display: { xs: 'none', md: 'block' },
              }}
            >
              <Box sx={{ position: 'sticky', top: 100 }}>
                <TableOfContents blocks={blocks} />
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>
    </>
  );
}
