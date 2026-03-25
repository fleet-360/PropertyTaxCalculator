import CitiesPageClient from '@/components/admin/CitiesPageClient';
import { loadCitiesAdminSummaries } from '@/lib/admin/loaders';

export default async function CitiesPage() {
  const initialCities = await loadCitiesAdminSummaries();
  return <CitiesPageClient initialCities={initialCities} />;
}
