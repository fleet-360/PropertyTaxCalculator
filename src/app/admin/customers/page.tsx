import CustomersPageClient from '@/components/admin/CustomersPageClient';
import { loadCustomersAdminList } from '@/lib/admin/loaders';

function spFirst(v: string | string[] | undefined): string {
  if (v === undefined) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page0 = Math.max(0, parseInt(spFirst(sp.page) || '0', 10) || 0);
  const limit = Math.max(1, Math.min(100, parseInt(spFirst(sp.limit) || '10', 10) || 10));
  const search = spFirst(sp.search);
  const status = spFirst(sp.status);
  const city = spFirst(sp.city);

  const data = await loadCustomersAdminList({
    page: page0 + 1,
    limit,
    search,
    status,
    city,
  });

  return (
    <CustomersPageClient
      customers={data.customers}
      total={data.total}
      page={page0}
      limit={limit}
      search={search}
      status={status}
      city={city}
    />
  );
}
