import SettingsFormClient from '@/components/admin/SettingsFormClient';
import { loadSettingsForAdmin } from '@/lib/admin/loaders';

export default async function SettingsPage() {
  const initialSettings = await loadSettingsForAdmin();
  return <SettingsFormClient initialSettings={initialSettings} />;
}
