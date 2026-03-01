export function isClassifiableUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

import { TAB_COLORS } from './constants';
import type { TabGroupColor } from './types';

export function getCategoryColor(category: string): TabGroupColor {
  const colorIndex =
    Math.abs(
      category.split('').reduce((a, b) => {
        const hash = (a << 5) - a + b.charCodeAt(0);
        return hash & hash;
      }, 0),
    ) % TAB_COLORS.length;

  return TAB_COLORS[colorIndex] ?? 'grey';
}
