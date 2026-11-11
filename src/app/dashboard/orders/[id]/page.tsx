import { OrdersCommerceView } from '@/features/orders/OrdersCommerceView';

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <OrdersCommerceView orderId={decodeURIComponent(params.id)} />;
}

