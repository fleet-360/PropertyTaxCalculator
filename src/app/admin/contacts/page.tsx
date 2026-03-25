import ContactsPageClient from '@/components/admin/ContactsPageClient';
import { loadContactsAdminList } from '@/lib/admin/loaders';

function spFirst(v: string | string[] | undefined): string {
  if (v === undefined) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page0 = Math.max(0, parseInt(spFirst(sp.page) || '0', 10) || 0);
  const limit = Math.max(1, Math.min(100, parseInt(spFirst(sp.limit) || '10', 10) || 10));
  const status = spFirst(sp.status);

  const data = await loadContactsAdminList({
    page: page0 + 1,
    limit,
    status,
  });

  return (
    <ContactsPageClient
      contacts={data.contacts}
      total={data.total}
      page={page0}
      limit={limit}
      status={status}
    />
  );
}
