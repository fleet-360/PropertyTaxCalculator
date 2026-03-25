import PostEditPageClient from '@/components/admin/PostEditPageClient';
import { loadPostLeanForEditor } from '@/lib/admin/loaders';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialPost = await loadPostLeanForEditor(id);
  return <PostEditPageClient postId={id} initialPost={initialPost} />;
}
