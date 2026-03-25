import SystemConfigFormClient from '@/components/admin/SystemConfigFormClient';
import { loadSystemConfigForAdmin } from '@/lib/admin/loaders';

export default async function SystemConfigPage() {
  const initialConfig = await loadSystemConfigForAdmin();
  return <SystemConfigFormClient initialConfig={initialConfig} />;
}
