import { ProductEditorView } from '@/features/products/ProductEditorView';

export default function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  return <ProductEditorView existingProductId={decodeURIComponent(params.id)} />;
}

