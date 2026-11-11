import { CustomersManagementView } from '@/features/customers/CustomersManagementView';

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <CustomersManagementView customerId={decodeURIComponent(params.id)} />;
}

