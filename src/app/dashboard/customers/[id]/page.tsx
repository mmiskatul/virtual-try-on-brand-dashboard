import { CustomerDetailView } from '@/features/customers/CustomersView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDetailView email={decodeURIComponent(id)} />;
}
