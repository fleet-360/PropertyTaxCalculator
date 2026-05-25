'use client';

import Link from 'next/link';
import MuiLink from '@mui/material/Link';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { blogCategoryPath, blogPostPath } from '@/lib/blog/routes';

interface PostCardProps {
  post: {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    featuredImage?: string;
    author?: string;
    category?: string;
    publishedAt?: Date | string;
  };
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Card
      component="article"
      elevation={0}
      sx={(theme) => ({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.brand.borderCard}`,
        boxShadow: 'none',
        transition: 'box-shadow 0.25s ease, transform 0.2s ease, border-color 0.25s ease',
        '&:hover': {
          boxShadow: '0 12px 28px rgba(11,26,71,0.10)',
          transform: 'translateY(-2px)',
          borderColor: theme.palette.brand.blueLight,
        },
      })}
    >
      <Box sx={{ position: 'relative' }}>
        {post.featuredImage ? (
          <CardMedia
            component="img"
            height="180"
            image={post.featuredImage}
            alt={post.title}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={(theme) => ({
              height: 180,
              background: `linear-gradient(135deg, ${theme.palette.brand.navyMid} 0%, ${theme.palette.brand.blue} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 700,
                userSelect: 'none',
              }}
            >
              חשוב לדעת
            </Typography>
          </Box>
        )}
        {post.category && post.category !== 'Uncategorized' && (
          <Link
            href={blogCategoryPath(post.category)}
            style={{
              position: 'absolute',
              top: 12,
              insetInlineStart: 12,
              textDecoration: 'none',
            }}
          >
            <Chip
              label={post.category}
              size="small"
              clickable
              sx={(theme) => ({
                backgroundColor: theme.palette.brand.blue,
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.72rem',
                opacity: 0.95,
                '&:hover': {
                  opacity: 1,
                  backgroundColor: theme.palette.brand.blueDark,
                },
              })}
            />
          </Link>
        )}
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2.5,
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={(theme) => ({
            fontWeight: 700,
            mb: 1,
            lineHeight: 1.4,
            fontSize: '15.5px',
            color: theme.palette.brand.navyDeep,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          })}
        >
          <Link
            href={blogPostPath(post.slug)}
            style={{
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            {post.title}
          </Link>
        </Typography>

        {post.excerpt && (
          <Typography
            sx={(theme) => ({
              mb: 2,
              lineHeight: 1.6,
              fontSize: '13px',
              color: theme.palette.brand.textMuted,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flexGrow: 1,
            })}
          >
            {post.excerpt}
          </Typography>
        )}

        <Box
          sx={{
            mt: 'auto',
            pt: 1.5,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <MuiLink
            component={Link}
            href={blogPostPath(post.slug)}
            underline="none"
            sx={(theme) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              fontSize: '13px',
              fontWeight: 600,
              color: theme.palette.brand.blue,
              '&:hover': { color: theme.palette.brand.blueDark },
            })}
          >
            המשך קריאה
            <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
          </MuiLink>
        </Box>
      </CardContent>
    </Card>
  );
}
