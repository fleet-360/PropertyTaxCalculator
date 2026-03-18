'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import PostEditor from '@/components/admin/PostEditor';

export default function NewPostPage() {
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (data: any) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create post');
    }

    const post = await res.json();
    router.push(`/admin/posts/${post._id}/edit`);
  };

  return (
    <PostEditor
      initialData={null}
      onSave={handleSave}
      isNew
    />
  );
}
