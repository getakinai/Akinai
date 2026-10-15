import type { CSSProperties } from 'react'

/**
 * Storefront theme presets and menu item types. Keep in sync with
 * `app/constants/storefront.ts`.
 */
export type ThemeColors = {
  primaryColor: string
  primaryForegroundColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
}

export const THEME_PRESET_KEYS = ['fresh', 'ocean', 'sunset', 'mono', 'custom'] as const

export type ThemePreset = (typeof THEME_PRESET_KEYS)[number]

export const THEME_PRESETS: Record<
  Exclude<ThemePreset, 'custom'>,
  ThemeColors & { label: string }
> = {
  fresh: {
    label: 'Fresh',
    primaryColor: '#14532d',
    primaryForegroundColor: '#ffffff',
    accentColor: '#84cc16',
    backgroundColor: '#f7f8f3',
    surfaceColor: '#ffffff',
    textColor: '#13201a',
  },
  ocean: {
    label: 'Ocean',
    primaryColor: '#0c4a6e',
    primaryForegroundColor: '#ffffff',
    accentColor: '#06b6d4',
    backgroundColor: '#f3f7fa',
    surfaceColor: '#ffffff',
    textColor: '#0f1d2a',
  },
  sunset: {
    label: 'Sunset',
    primaryColor: '#9a3412',
    primaryForegroundColor: '#ffffff',
    accentColor: '#f59e0b',
    backgroundColor: '#fbf6f1',
    surfaceColor: '#ffffff',
    textColor: '#2a1710',
  },
  mono: {
    label: 'Mono',
    primaryColor: '#0a0a0b',
    primaryForegroundColor: '#ffffff',
    accentColor: '#6b6f76',
    backgroundColor: '#f5f5f6',
    surfaceColor: '#ffffff',
    textColor: '#0a0a0b',
  },
}

export const THEME_COLOR_FIELDS: { key: keyof ThemeColors; label: string; hint: string }[] = [
  { key: 'primaryColor', label: 'Primary', hint: 'Header bar, buttons and banners' },
  { key: 'primaryForegroundColor', label: 'Text on primary', hint: 'Text on primary surfaces' },
  { key: 'accentColor', label: 'Accent', hint: 'Badges, highlights and sale prices' },
  { key: 'backgroundColor', label: 'Background', hint: 'Page background' },
  { key: 'surfaceColor', label: 'Surface', hint: 'Cards and inputs' },
  { key: 'textColor', label: 'Text', hint: 'Headings and body text' },
]

export const HEX_COLOR = /^#[0-9a-f]{6}$/i

export const MENU_ITEM_TYPES = ['collection', 'page', 'url'] as const

export type MenuItemType = (typeof MENU_ITEM_TYPES)[number]

/** `featured` keeps the collection's own sort order. */
export const STOREFRONT_COLLECTION_SORTS = ['featured', 'price', 'title', 'newest'] as const

export type StorefrontCollectionSort = (typeof STOREFRONT_COLLECTION_SORTS)[number]

export type SortDirection = 'asc' | 'desc'

export const STOREFRONT_COLLECTION_SORT_LABELS: Record<StorefrontCollectionSort, string> = {
  featured: 'Featured',
  price: 'Price',
  title: 'Name',
  newest: 'Date added',
}

/** Direction button labels per sort; `featured` has no direction. */
export const STOREFRONT_SORT_DIRECTION_LABELS: Record<
  Exclude<StorefrontCollectionSort, 'featured'>,
  Record<SortDirection, string>
> = {
  price: { asc: 'Low to high', desc: 'High to low' },
  title: { asc: 'A to Z', desc: 'Z to A' },
  newest: { asc: 'Oldest first', desc: 'Newest first' },
}

/** Direction picked when switching to a sort. */
export const STOREFRONT_SORT_DEFAULT_DIRECTION: Record<StorefrontCollectionSort, SortDirection> = {
  featured: 'asc',
  price: 'asc',
  title: 'asc',
  newest: 'desc',
}

export const MENU_ITEM_TYPE_LABELS: Record<MenuItemType, string> = {
  collection: 'Collection',
  page: 'Page',
  url: 'Custom link',
}

export const PROMO_PLACEMENTS = ['home_middle', 'home_bottom'] as const

export type PromoPlacement = (typeof PROMO_PLACEMENTS)[number]

export const PROMO_PLACEMENT_LABELS: Record<PromoPlacement, string> = {
  home_middle: 'Middle of home page',
  home_bottom: 'Bottom of home page',
}

export const PROMO_TONES = ['primary', 'accent'] as const

export type PromoTone = (typeof PROMO_TONES)[number]

export const PROMO_TONE_LABELS: Record<PromoTone, string> = {
  primary: 'Primary color',
  accent: 'Soft accent',
}

export const MAX_PROMO_BANNERS_PER_PLACEMENT = 4

export const FEATURE_ICONS = [
  'truck',
  'leaf',
  'shield-check',
  'refresh-cw',
  'star',
  'gift',
  'clock',
  'heart',
  'tag',
  'sparkles',
  'headphones',
  'credit-card',
] as const

export type FeatureIcon = (typeof FEATURE_ICONS)[number]

export const FEATURE_ICON_LABELS: Record<FeatureIcon, string> = {
  'truck': 'Delivery truck',
  'leaf': 'Leaf',
  'shield-check': 'Shield',
  'refresh-cw': 'Returns',
  'star': 'Star',
  'gift': 'Gift',
  'clock': 'Clock',
  'heart': 'Heart',
  'tag': 'Price tag',
  'sparkles': 'Sparkles',
  'headphones': 'Support',
  'credit-card': 'Card payment',
}

export const MAX_FEATURES = 8

/**
 * Inline CSS variables for an element marked `data-storefront`. Invalid
 * colors are skipped so the defaults from `app.css` apply instead.
 */
export function themeStyle(colors: Partial<ThemeColors> | undefined): CSSProperties {
  if (!colors) return {}
  const vars: Record<string, string> = {}
  const map: [keyof ThemeColors, string][] = [
    ['primaryColor', '--sf-primary'],
    ['primaryForegroundColor', '--sf-primary-fg'],
    ['accentColor', '--sf-accent'],
    ['backgroundColor', '--sf-bg'],
    ['surfaceColor', '--sf-surface'],
    ['textColor', '--sf-text'],
  ]
  for (const [key, cssVar] of map) {
    const value = colors[key]
    if (value && HEX_COLOR.test(value)) vars[cssVar] = value
  }
  return vars as CSSProperties
}
