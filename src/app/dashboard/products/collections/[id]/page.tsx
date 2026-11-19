import { CollectionsView } from '@/features/products/CollectionsView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CollectionsView mode="edit" editId={decodeURIComponent(id)} />;
}
