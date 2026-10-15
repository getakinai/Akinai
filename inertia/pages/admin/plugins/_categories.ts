import { CreditCard, Megaphone, Puzzle, type LucideIcon } from 'lucide-react'

export type CategoryInfo = { label: string; description: string; icon: LucideIcon }

/**
 * Plugin categories in catalog display order. Keys must match
 * `PLUGIN_CATEGORIES` in app/constants/plugins.ts.
 */
export const CATEGORIES: Record<string, CategoryInfo> = {
  storefront: {
    label: 'Storefront',
    description: 'Sections and blocks that appear on your online store.',
    icon: Puzzle,
  },
  payments: {
    label: 'Payments',
    description: 'Ways customers can pay at checkout. Set them up per market under Payments.',
    icon: CreditCard,
  },
  marketing: {
    label: 'Marketing',
    description: 'Tools that bring customers back and grow your sales.',
    icon: Megaphone,
  },
}

export const CATEGORY_ORDER = Object.keys(CATEGORIES)

export function categoryInfo(category: string): CategoryInfo {
  return CATEGORIES[category] ?? { label: category, description: '', icon: Puzzle }
}
