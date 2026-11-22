import { CategoriesView } from '@/features/products/CategoriesView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CategoriesView mode="edit" editId={decodeURIComponent(id)} />;
}
