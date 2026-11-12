import React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { requireBrandPageSession } from '@/lib/server-auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const verified = await requireBrandPageSession('/login');
  return <DashboardShell verifiedUser={verified}>{children}</DashboardShell>;
}

