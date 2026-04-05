import AiPromptsPageClient from '@/components/admin/AiPromptsPageClient';
import { loadAiPromptsAdmin } from '@/lib/admin/loaders';

export default async function AiPromptsPage() {
  const initialPrompts = await loadAiPromptsAdmin();
  return <AiPromptsPageClient initialPrompts={initialPrompts} />;
}
