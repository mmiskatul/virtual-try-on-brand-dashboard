import { SettingsPalette } from '@/features/settings/SettingsPalette';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Ctrl+K: jump to any setting from anywhere in Settings */}
      <SettingsPalette />
    </>
  );
}
