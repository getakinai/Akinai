/**
 * Storefront theme presets and menu item types. Keep in sync with
 * `inertia/lib/storefront.ts`.
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

export const THEME_PRESETS: Record<Exclude<ThemePreset, 'custom'>, ThemeColors> = {
  fresh: {
    primaryColor: '#14532d',
    primaryForegroundColor: '#ffffff',
    accentColor: '#84cc16',
    backgroundColor: '#f7f8f3',
    surfaceColor: '#ffffff',
    textColor: '#13201a',
  },
  ocean: {
    primaryColor: '#0c4a6e',
    primaryForegroundColor: '#ffffff',
    accentColor: '#06b6d4',
    backgroundColor: '#f3f7fa',
    surfaceColor: '#ffffff',
    textColor: '#0f1d2a',
  },
  sunset: {
    primaryColor: '#9a3412',
    primaryForegroundColor: '#ffffff',
    accentColor: '#f59e0b',
    backgroundColor: '#fbf6f1',
    surfaceColor: '#ffffff',
    textColor: '#2a1710',
  },
  mono: {
    primaryColor: '#0a0a0b',
    primaryForegroundColor: '#ffffff',
    accentColor: '#6b6f76',
    backgroundColor: '#f5f5f6',
    surfaceColor: '#ffffff',
    textColor: '#0a0a0b',
  },
}

export const DEFAULT_THEME_PRESET = 'fresh' satisfies ThemePreset

export const HEX_COLOR = /^#[0-9a-f]{6}$/i

export const MENU_ITEM_TYPES = ['collection', 'page', 'url'] as const

export type MenuItemType = (typeof MENU_ITEM_TYPES)[number]

/** No SVG: it can carry scripts when served inline from our origin. */
export const HERO_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

export const MAX_HERO_IMAGE_UPLOAD_SIZE_MB = 5

export const PROMO_PLACEMENTS = ['home_middle', 'home_bottom'] as const

export type PromoPlacement = (typeof PROMO_PLACEMENTS)[number]

export const PROMO_TONES = ['primary', 'accent'] as const

export type PromoTone = (typeof PROMO_TONES)[number]

export const PROMO_IMAGE_FOLDER = 'storefront/promos'

export const COLLECTION_IMAGE_FOLDER = 'collections'

export const VENDOR_IMAGE_FOLDER = 'vendors'

export const MAX_PROMO_BANNERS_PER_PLACEMENT = 4

/** Lucide icon names offered for feature tiles. */
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

export const MAX_FEATURES = 8

export const HOME_TESTIMONIALS_LIMIT = 6

/** `featured` keeps the collection's own sort order. */
export const STOREFRONT_COLLECTION_SORTS = ['featured', 'price', 'title', 'newest'] as const

export type StorefrontCollectionSort = (typeof STOREFRONT_COLLECTION_SORTS)[number]

export const STOREFRONT_COLLECTION_PER_PAGE = 24

/** Most vendors / product types a shopper can select at once. */
export const STOREFRONT_FILTER_MAX_IDS = 30

/** Most option values (`Size:M`) a shopper can select at once. */
export const STOREFRONT_FILTER_MAX_OPTIONS = 30

/** Highest price a price filter accepts. */
export const STOREFRONT_FILTER_MAX_PRICE = 1_000_000_000

/** Most entries in each facet list (vendors, types, options, values per option). */
export const STOREFRONT_FACET_LIMIT = 50

/** Header the storefront sends its catalog token in. */
export const CATALOG_TOKEN_HEADER = 'x-catalog-token'

/** Rejected catalog requests carry this `code` so the client can refresh its token. */
export const CATALOG_TOKEN_ERROR_CODE = 'E_CATALOG_TOKEN'

export const CATALOG_TOKEN_TTL_SECONDS = 15 * 60

export const CATALOG_CURSOR_TTL = '30m'

/** Session key holding the random nonce catalog tokens and cursors are bound to. */
export const CATALOG_NONCE_SESSION_KEY = 'storefront.catalogNonce'

/** Deepest page a catalog cursor can reach (480 collection products, 200 reviews). */
export const STOREFRONT_MAX_PAGE_DEPTH = 20

export const CATALOG_CURSOR_MAX_LENGTH = 512
