import { Compass, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

/** Bottom navigation keeps only «Каталог» and «Профиль» by product decision. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Каталог', icon: Compass, end: true },
  { to: '/profile', label: 'Профиль', icon: UserRound },
];

export const ADMIN_ITEM: NavItem = { to: '/admin', label: 'Админ', icon: ShieldCheck };
