import { type BadgeTone } from '~/lib/styles'
import {
  type CollectionRuleField,
  type CollectionRuleOperator,
  type CollectionSortOrder,
  type CollectionStatus,
  type CollectionType,
} from './_types'

export const collectionStatusMeta: Record<CollectionStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  active: { label: 'Active', tone: 'success' },
  archived: { label: 'Archived', tone: 'warning' },
}

export const collectionTypeMeta: Record<
  CollectionType,
  { label: string; tone: BadgeTone; description: string }
> = {
  automated: {
    label: 'Automated',
    tone: 'info',
    description:
      'Products that match your conditions are added and removed automatically. Best for categories, sales and new arrivals.',
  },
  manual: {
    label: 'Manual',
    tone: 'purple',
    description:
      'You pick each product and its order by hand. Best for curated sets like gift bundles or staff picks.',
  },
}

export const sortOrderLabels: Record<CollectionSortOrder, string> = {
  manual: 'Manual (set by hand)',
  best_selling: 'Best selling',
  title_asc: 'Title: A–Z',
  title_desc: 'Title: Z–A',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  created_desc: 'Newest first',
  created_asc: 'Oldest first',
}

export const ruleFieldLabels: Record<CollectionRuleField, string> = {
  title: 'Product title',
  product_type: 'Product type',
  vendor: 'Vendor',
  tag: 'Product tag',
  variant_price: 'Price',
  compare_at_price: 'Compare-at price',
  inventory_available: 'Inventory stock',
  option_value: 'Option value',
}

export const ruleOperatorLabels: Record<CollectionRuleOperator, string> = {
  equals: 'is equal to',
  not_equals: 'is not equal to',
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  greater_than: 'is greater than',
  less_than: 'is less than',
  is_set: 'is set (on sale)',
  is_not_set: 'is not set',
}

export const ruleValuePlaceholders: Record<CollectionRuleField, string> = {
  title: 'e.g. Pasalubong',
  product_type: 'e.g. Gift box',
  vendor: 'e.g. Brand name',
  tag: 'e.g. new',
  variant_price: '0.00',
  compare_at_price: '0.00',
  inventory_available: '0',
  option_value: 'e.g. Red',
}
