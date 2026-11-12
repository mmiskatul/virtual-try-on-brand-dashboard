import React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { requireBrandPageSession } from '@/lib/server-auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireBrandPageSession('/login');
  return <DashboardShell>{children}</DashboardShell>;
}

