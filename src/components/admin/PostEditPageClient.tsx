'use client';

import * as React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PostEditor from '@/components/admin/PostEditor';
import type { PostData } from '@/lib/types/post';

export default function PostEditPageClient({
  postId,
  initialPost,
}: {
  postId: string;
  initialPost: Record<string, unknown> | null;
}) {
  const [postData, setPostData] = React.useState<Record<string, unknown> | null>(initialPost);

  React.useEffect(() => {
    setPostData(initialPost);
  }, [initialPost]);

  const handleSave = async (data: PostData) => {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error((errorData as { message?: string }).message || 'שמירה נכשלה');
    }

    const updated = await res.json();
    setPostData(updated as Record<string, unknown>);
  };

  if (!postData) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          המאמר לא נמצא
        </Alert>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          404 — המאמר לא קיים
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          ייתכן שהמאמר נמחק או שהקישור שגוי.
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} component={Link} href="/admin/posts">
          חזרה למאמרים
        </Button>
      </Box>
    );
  }

  return (
    <PostEditor
      initialData={postData as unknown as PostData}
      onSave={handleSave}
      isNew={false}
    />
  );
}
