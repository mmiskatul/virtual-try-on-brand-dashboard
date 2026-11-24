import {
  BadgeCheck,
  Building2,
  Clock,
  Image as ImageIcon,
  Lock,
  Palette,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type SettingsModuleId =
  | 'profile'
  | 'business'
  | 'social'
  | 'verification'
  | 'theme'
  | 'media'
  | 'store'
  | 'audience'
  | 'delivery'
  | 'returns'
  | 'seo'
  | 'privacy'
  | 'security'
  | 'account';

export interface SettingsModule {
  id: SettingsModuleId;
  title: string;
  description: string;
  group: 'Brand' | 'Store' | 'Try-on' | 'Account';
  icon: LucideIcon;
  /** Extra words the search finds this module by. */
  keywords: string;
}

export const SETTINGS_MODULES: SettingsModule[] = [
  { id: 'profile', title: 'Brand profile', description: 'Name, contact, tagline and your story', group: 'Brand', icon: Building2, keywords: 'name email phone slogan tagline about story description announcement owner general' },
  { id: 'business', title: 'Business details', description: 'Legal name, registration and address', group: 'Brand', icon: Clock, keywords: 'legal registration address city country year company' },
  { id: 'social', title: 'Social links', description: 'Instagram, Facebook and your website', group: 'Brand', icon: Share2, keywords: 'instagram facebook website link handle' },
  { id: 'verification', title: 'Verification', description: 'Your trust badge and what is left to do', group: 'Brand', icon: BadgeCheck, keywords: 'verified badge score checks trust' },
  { id: 'theme', title: 'Theme & identity', description: 'Colours, fonts and button style', group: 'Brand', icon: Palette, keywords: 'colour color font typography header button layout design' },
  { id: 'media', title: 'Logos & media', description: 'Logo, banner and share image', group: 'Brand', icon: ImageIcon, keywords: 'logo banner image upload cover photo' },
  { id: 'store', title: 'Open or closed', description: 'Pause orders for a short time', group: 'Store', icon: Store, keywords: 'open close pause vacation restock' },
  { id: 'audience', title: 'Who the store is for', description: 'Women, men or both', group: 'Store', icon: Users, keywords: 'audience gender women men unisex both target default try-on' },
  { id: 'delivery', title: 'Delivery charges', description: 'Delivery fee and free delivery', group: 'Store', icon: Truck, keywords: 'shipping fee free delivery cost' },
  { id: 'returns', title: 'Return policy', description: 'Return window and what shoppers read', group: 'Store', icon: RotateCcw, keywords: 'return refund exchange policy days window' },
  { id: 'seo', title: 'Search & sharing', description: 'How your store looks in Google', group: 'Store', icon: Search, keywords: 'seo google title description meta share' },
  { id: 'privacy', title: 'Try-on privacy', description: 'How long photos are kept, and consent', group: 'Try-on', icon: Lock, keywords: 'photo retention days consent data gdpr' },
  { id: 'security', title: 'Security & devices', description: 'Password and where you are signed in', group: 'Account', icon: ShieldCheck, keywords: 'password devices sessions sign out login' },
  { id: 'account', title: 'Owner & shop address', description: 'Who owns this shop and its web address', group: 'Account', icon: UserRound, keywords: 'owner slug url address account' },
];

export const SETTINGS_GROUPS: SettingsModule['group'][] = ['Brand', 'Store', 'Try-on', 'Account'];

export function settingsHref(id: SettingsModuleId): string {
  return `/dashboard/settings/${id}`;
}

export function findSettingsModule(id: string): SettingsModule | undefined {
  return SETTINGS_MODULES.find((m) => m.id === id);
}

export function searchSettingsModules(query: string): SettingsModule[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return SETTINGS_MODULES;
  return SETTINGS_MODULES.filter((m) => {
    const hay = `${m.title} ${m.description} ${m.group} ${m.keywords}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
