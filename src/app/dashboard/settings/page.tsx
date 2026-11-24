import { BrandManagementView, type BrandManagementTab } from '@/features/brand/BrandManagementView';

const TABS: BrandManagementTab[] = ['profile', 'identity', 'media'];

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const initialTab = TABS.find((t) => t === tab) ?? 'profile';
  return <BrandManagementView initialTab={initialTab} />;
}
