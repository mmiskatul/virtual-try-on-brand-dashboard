import { CustomerDetailView } from '@/features/customers/CustomersView';

export default function Page({ params }: { params: { id: string } }) {
  return <CustomerDetailView email={decodeURIComponent(params.id)} />;
}
