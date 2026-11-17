import { SupportView } from '@/features/support/SupportView';

export default function Page({ searchParams }: { searchParams?: { subject?: string } }) {
  return <SupportView initialSubject={searchParams?.subject?.slice(0, 120) || ''} />;
}
