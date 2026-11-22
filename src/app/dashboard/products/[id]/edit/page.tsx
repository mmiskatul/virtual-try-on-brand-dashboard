import { ProductEditorView } from '@/features/products/ProductEditorView';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductEditorView existingProductId={decodeURIComponent(id)} />;
}

