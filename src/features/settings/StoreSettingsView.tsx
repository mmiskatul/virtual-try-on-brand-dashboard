'use client';

import { PageHeader, PermissionGate } from '../../components/shared/UiPrimitives';
import { StoreSettingsPanel } from './StoreSettingsPanel';

export function StoreSettingsView() {
  return (
    <PermissionGate module="settings" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Settings • Store"
          title="Store"
          subtitle="Whether your store is open, what delivery costs, and how your store looks in Google."
        />
        <StoreSettingsPanel />
      </div>
    </PermissionGate>
  );
}
