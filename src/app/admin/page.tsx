import AdminDashboardView from '@/components/admin/AdminDashboardView';
import { getAdminDashboardData } from '@/lib/admin/getAdminDashboardData';

export default async function AdminDashboardPage() {
  const { posts, stats } = await getAdminDashboardData();
  return <AdminDashboardView posts={posts} stats={stats} />;
}
