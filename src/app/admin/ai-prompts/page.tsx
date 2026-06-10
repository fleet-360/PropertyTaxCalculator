import AiPromptsPageClient from '@/components/admin/AiPromptsPageClient';
import { loadAiPromptsAdmin, loadAppealSamplesAdmin } from '@/lib/admin/loaders';

export default async function AiPromptsPage() {
  const [initialPrompts, initialAppealSamples] = await Promise.all([
    loadAiPromptsAdmin(),
    loadAppealSamplesAdmin(),
  ]);
  return (
    <AiPromptsPageClient
      initialPrompts={initialPrompts}
      initialAppealSamples={initialAppealSamples}
    />
  );
}
