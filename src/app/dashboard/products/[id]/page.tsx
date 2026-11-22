import { ProductPreviewView } from '@/features/products/ProductPreviewView';

export default async function ProductPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductPreviewView productId={decodeURIComponent(id)} />;
}
