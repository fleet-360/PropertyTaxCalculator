'use client';

import Link from 'next/link';
import MuiLink from '@mui/material/Link';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import { BLOG_PATHS, blogCategoryPath } from '@/lib/blog/routes';
import { formatPostDateHe, formatPostDateISO } from '@/lib/dates';
import BlockRenderer from '@/components/editor/BlockRenderer';
import ShareButtons from '@/components/blog/ShareButtons';
import TableOfContents from '@/components/blog/TableOfContents';
import type { BlockData } from '@/components/editor/types';

interface PostData {
  title: string;
  slug: string;
  author?: string;
  category?: string;
  publishedAt?: string | Date;
  featuredImage?: string;
  tags?: string[];
  content?: { blocks?: BlockData[] };
}

interface PostArticleProps {
  post: PostData;
}

export default function PostArticle({ post }: PostArticleProps) {
  const blocks = post.content?.blocks || [];
  const hasHeadings =
    blocks.filter((b) => b.type === 'heading' && b.data?.text).length >= 2;

  return (
    <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 }, pt: { xs: 1, md: 2 } }}>
      <Grid container spacing={{ xs: 3, md: 5 }}>
        {/* Sidebar (right side in RTL) — Table of Contents */}
        {hasHeadings && (
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{
              display: { xs: 'none', md: 'block' },
              order: { md: 0 },
            }}
          >
            <Box sx={{ position: 'sticky', top: 100 }}>
              <TableOfContents blocks={blocks} />
            </Box>
          </Grid>
        )}

        {/* Main Content (left side in RTL) */}
        <Grid size={{ xs: 12, md: hasHeadings ? 8 : 12 }} sx={{ order: { md: 1 } }}>
          <Box
            component="article"
            itemScope
            itemType="https://schema.org/BlogPosting"
            sx={{ maxWidth: hasHeadings ? '100%' : 800, mx: 'auto' }}
          >
            {post.featuredImage && (
              <Box
                component="figure"
                sx={{
                  m: 0,
                  mb: { xs: 3, md: 4 },
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={post.featuredImage}
                  alt={post.title}
                  itemProp="image"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </Box>
            )}

            {/* Meta Info row */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1.5,
                color: 'text.secondary',
                fontSize: '0.85rem',
                mb: 2,
              }}
            >
              {post.category && post.category !== 'Uncategorized' && (
                <MuiLink
                  component={Link}
                  href={blogCategoryPath(post.category)}
                  underline="none"
                >
                  <Chip
                    label={post.category}
                    clickable
                    size="small"
                    sx={(theme) => ({
                      backgroundColor: theme.palette.brand.blue,
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      '&:hover': { backgroundColor: theme.palette.brand.blueDark },
                    })}
                  />
                </MuiLink>
              )}
              {post.author && (
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
              )}
              {post.publishedAt && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    &middot;
                  </Typography>
                  <Typography
                    variant="body2"
                    component="time"
                    dateTime={formatPostDateISO(post.publishedAt)}
                    itemProp="datePublished"
                    content={formatPostDateISO(post.publishedAt)}
                  >
                    {formatPostDateHe(post.publishedAt)}
                  </Typography>
                </>
              )}
            </Box>

            {/* Schema.org headline (the visible title is rendered inside the hero) */}
            <meta itemProp="headline" content={post.title} />

            {/* Post Content */}
            <Box
              component="section"
              itemProp="articleBody"
              sx={(theme) => ({
                '& .blog-content': {
                  fontSize: { xs: '0.95rem', md: '1.05rem' },
                  lineHeight: 1.85,
                },
                '& h2': {
                  fontSize: { xs: '1.2rem', md: '1.4rem' },
                  fontWeight: 700,
                  color: theme.palette.brand.navyDeep,
                  mt: 4,
                  mb: 1.5,
                },
                '& h3': {
                  fontSize: { xs: '1.05rem', md: '1.2rem' },
                  fontWeight: 700,
                  color: theme.palette.brand.navyDeep,
                  mt: 3,
                  mb: 1,
                },
                '& p': {
                  fontSize: { xs: '0.95rem', md: '1rem' },
                  lineHeight: 1.85,
                  color: theme.palette.brand.textMuted,
                  mb: 2,
                },
              })}
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
                    fontSize: '0.8rem',
                  }}
                >
                  תגיות
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
                          backgroundColor: 'action.hover',
                          borderColor: 'primary.main',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <ShareButtons title={post.title} slug={post.slug} />

            <Box sx={{ mt: 5, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
              <MuiLink
                component={Link}
                href={BLOG_PATHS.home}
                underline="hover"
                sx={(theme) => ({
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  color: theme.palette.brand.blue,
                })}
              >
                &larr; חזרה לכל הכתבות
              </MuiLink>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
