import type Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';

import { sr } from '../i18n/sr';

type IconName = ComponentProps<typeof Ionicons>['name'];
export type NavItem = {
  href: '/dashboard' | '/receipts' | '/scan' | '/statistics' | '/profile';
  label: string;
  icon: IconName;
  activeIcon: IconName;
};

// Shared by the phone bottom bar and the desktop side menu.
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: sr.nav.home, icon: 'home-outline', activeIcon: 'home' },
  { href: '/receipts', label: sr.nav.receipts, icon: 'receipt-outline', activeIcon: 'receipt' },
  { href: '/scan', label: sr.nav.scan, icon: 'qr-code-outline', activeIcon: 'qr-code' },
  { href: '/statistics', label: sr.nav.statistics, icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  { href: '/profile', label: sr.nav.profile, icon: 'person-outline', activeIcon: 'person' },
];

// A single receipt belongs under "receipts".
export function isActive(pathname: string, href: NavItem['href']): boolean {
  if (href === '/receipts') return pathname === '/receipts' || pathname.startsWith('/receipt/');
  return pathname === href;
}
