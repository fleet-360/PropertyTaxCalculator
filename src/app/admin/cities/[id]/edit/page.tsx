import { notFound } from 'next/navigation';
import CityTariffEditor from '@/components/admin/CityTariffEditor';
import { loadCityTariffForEditor } from '@/lib/admin/loaders';
import type { ICityTariffData } from '@/lib/types/city-tariff';

export default async function EditCityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await loadCityTariffForEditor(id);
  if (!raw) {
    notFound();
  }
  return <CityTariffEditor city={raw as unknown as ICityTariffData} />;
}
