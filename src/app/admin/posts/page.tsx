import PostsListPageClient from '@/components/admin/PostsListPageClient';
import { loadPostCategoriesDistinct, loadPostsAdminList } from '@/lib/admin/loaders';
import type { PostSortField, SortDirection } from '@/lib/types/post';

function spFirst(v: string | string[] | undefined): string {
  if (v === undefined) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

const SORT_FIELDS: PostSortField[] = ['title', 'status', 'category', 'author', 'createdAt'];

function parseSortField(raw: string): PostSortField {
  return SORT_FIELDS.includes(raw as PostSortField) ? (raw as PostSortField) : 'createdAt';
}

function parseSortDir(raw: string): SortDirection {
  return raw === 'asc' ? 'asc' : 'desc';
}

export default async function PostsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page0 = Math.max(0, parseInt(spFirst(sp.page) || '0', 10) || 0);
  const limit = Math.max(1, Math.min(100, parseInt(spFirst(sp.limit) || '10', 10) || 10));
  const search = spFirst(sp.search);
  const status = spFirst(sp.status);
  const category = spFirst(sp.category);
  const sortField = parseSortField(spFirst(sp.sort));
  const sortDirection = parseSortDir(spFirst(sp.dir));

  const [data, categories] = await Promise.all([
    loadPostsAdminList({
      page: page0 + 1,
      limit,
      search,
      status,
      category,
      sortField,
      sortDirection,
    }),
    loadPostCategoriesDistinct(),
  ]);

  return (
    <PostsListPageClient
      posts={data.posts}
      total={data.total}
      page={page0}
      limit={limit}
      search={search}
      status={status}
      category={category}
      sortField={sortField}
      sortDirection={sortDirection}
      categories={categories}
    />
  );
}
