import Link from 'next/link';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

interface PostCardProps {
  post: {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    featuredImage?: string;
    author: string;
    category: string;
    publishedAt?: Date | string;
  };
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Card
      component="article"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
        '&:hover': {
          boxShadow: '0 8px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)',
          transform: 'translateY(-2px)',
        },
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {post.featuredImage ? (
          <CardMedia
            component="img"
            height="220"
            image={post.featuredImage}
            alt={post.title}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              height: 220,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: 'rgba(255,255,255,0.3)',
                fontWeight: 700,
                userSelect: 'none',
              }}
            >
              Blog
            </Typography>
          </Box>
        )}
        {post.category && post.category !== 'Uncategorized' && (
          <Link
            href={`/category/${encodeURIComponent(post.category.toLowerCase())}`}
            style={{ position: 'absolute', top: 12, left: 12, textDecoration: 'none' }}
          >
            <Chip
              label={post.category}
              size="small"
              clickable
              sx={{
                backgroundColor: 'rgba(25, 118, 210, 0.9)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.75rem',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 1)',
                },
              }}
            />
          </Link>
        )}
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 3,
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 700,
            mb: 1,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          <Link
            href={`/${post.slug}`}
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
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flexGrow: 1,
            }}
          >
            {post.excerpt}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 'auto',
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {post.author}
          </Typography>
          {post.publishedAt && (
            <Typography
              variant="caption"
              color="text.secondary"
              component="time"
              dateTime={
                typeof post.publishedAt === 'string'
                  ? post.publishedAt
                  : post.publishedAt.toISOString()
              }
            >
              {formatDate(post.publishedAt)}
            </Typography>
          )}
        </Box>

        <Link
          href={`/${post.slug}`}
          style={{
            display: 'inline-block',
            marginTop: '12px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#1976d2',
            textDecoration: 'none',
          }}
        >
          Read more &rarr;
        </Link>
      </CardContent>
    </Card>
  );
}
