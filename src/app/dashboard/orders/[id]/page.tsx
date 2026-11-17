import { OrdersCommerceView } from '@/features/orders/OrdersCommerceView';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrdersCommerceView orderId={decodeURIComponent(id)} />;
}

