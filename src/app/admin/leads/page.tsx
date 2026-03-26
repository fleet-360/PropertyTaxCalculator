import LeadsPageClient from '@/components/admin/LeadsPageClient';
import { loadLeadsAdminList } from '@/lib/admin/loaders';

function spFirst(v: string | string[] | undefined): string {
  if (v === undefined) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page0 = Math.max(0, parseInt(spFirst(sp.page) || '0', 10) || 0);
  const limit = Math.max(1, Math.min(100, parseInt(spFirst(sp.limit) || '10', 10) || 10));
  const search = spFirst(sp.search);
  const status = spFirst(sp.status);
  const source = spFirst(sp.source);
  const abandonmentStage = spFirst(sp.abandonmentStage);
  const city = spFirst(sp.city);

  const data = await loadLeadsAdminList({
    page: page0 + 1,
    limit,
    search,
    status,
    source,
    abandonmentStage,
    city,
  });

  return (
    <LeadsPageClient
      leads={data.leads}
      total={data.total}
      page={page0}
      limit={limit}
      search={search}
      status={status}
      source={source}
      abandonmentStage={abandonmentStage}
      city={city}
    />
  );
}
