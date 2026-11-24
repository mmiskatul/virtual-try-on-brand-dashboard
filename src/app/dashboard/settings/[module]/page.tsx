import { notFound } from 'next/navigation';
import { SettingsModuleView } from '@/features/settings/SettingsModuleView';
import { findSettingsModule } from '@/config/settingsModules';

export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const found = findSettingsModule(module);
  if (!found) notFound();
  return <SettingsModuleView module={found.id} />;
}
