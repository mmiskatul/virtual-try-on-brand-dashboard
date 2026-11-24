'use client';

import { BrandManagementView } from '../brand/BrandManagementView';
import type { SettingsModuleId } from '../../config/settingsModules';
import { AccountSettingsView, SecuritySettingsView } from './AccountSettingsView';
import { PrivacySettingsView } from './PrivacySettingsView';
import { StoreSettingsPanel } from './StoreSettingsPanel';

/** Shows the one settings module that was picked on the hub. */
export function SettingsModuleView({ module }: { module: SettingsModuleId }) {
  switch (module) {
    case 'profile':
    case 'business':
    case 'social':
    case 'verification':
    case 'theme':
    case 'media':
      return <BrandManagementView section={module} />;
    case 'store':
    case 'delivery':
    case 'audience':
    case 'returns':
    case 'seo':
      return <StoreSettingsPanel section={module} />;
    case 'privacy':
      return <PrivacySettingsView />;
    case 'security':
      return <SecuritySettingsView />;
    case 'account':
      return <AccountSettingsView />;
  }
}
