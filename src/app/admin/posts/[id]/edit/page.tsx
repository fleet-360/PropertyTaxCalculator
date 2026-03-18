'use client';
import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PostEditor from '@/components/admin/PostEditor';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [postData, setPostData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`/api/posts/${id}`);
        if (res.status === 404) {
          setError('Post not found');
          setLoading(false);
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch post');
        }

        const data = await res.json();
        setPostData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPost();
    }
  }, [id]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (data: any) => {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update post');
    }

    // Refresh post data after save
    const updated = await res.json();
    setPostData(updated);
  };

  if (loading) {
    return (
      <Box>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton width="40%" height={32} />
            <Box sx={{ flex: 1 }} />
            <Skeleton width={80} height={36} />
            <Skeleton width={80} height={36} />
          </Box>
        </Paper>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Skeleton width="100%" height={56} sx={{ mb: 2 }} />
              <Skeleton width="60%" height={40} />
            </Paper>
            <Paper sx={{ p: 3 }}>
              <Skeleton width="100%" height={300} />
            </Paper>
          </Box>
          <Box sx={{ width: 350 }}>
            <Skeleton width="100%" height={200} sx={{ mb: 2 }} />
            <Skeleton width="100%" height={150} sx={{ mb: 2 }} />
            <Skeleton width="100%" height={150} />
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        {error === 'Post not found' && (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              404 - Post Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              The post you are looking for does not exist or has been deleted.
            </Typography>
          </Box>
        )}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/posts')}
        >
          Back to Posts
        </Button>
      </Box>
    );
  }

  return (
    <PostEditor
      initialData={postData}
      onSave={handleSave}
      isNew={false}
    />
  );
}
