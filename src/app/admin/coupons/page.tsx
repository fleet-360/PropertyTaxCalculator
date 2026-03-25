import CouponsPageClient from '@/components/admin/CouponsPageClient';
import { loadCouponsAdmin } from '@/lib/admin/loaders';

export default async function CouponsPage() {
  const initialCoupons = await loadCouponsAdmin();
  return <CouponsPageClient initialCoupons={initialCoupons} />;
}
