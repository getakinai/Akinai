import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'

export const COLLECTION_RULE_FIELDS = [
  'title',
  'product_type',
  'vendor',
  'tag',
  'variant_price',
  'compare_at_price',
  'inventory_available',
  'option_value',
] as const

export type CollectionRuleField = (typeof COLLECTION_RULE_FIELDS)[number]

export const COLLECTION_RULE_OPERATORS_LIST = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'is_set',
  'is_not_set',
] as const

export type CollectionRuleOperator = (typeof COLLECTION_RULE_OPERATORS_LIST)[number]

/**
 * Operators allowed for each field. Keep in sync with
 * `inertia/pages/admin/collections/_types.ts`.
 */
export const COLLECTION_RULE_OPERATORS: Record<
  CollectionRuleField,
  readonly CollectionRuleOperator[]
> = {
  title: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
  product_type: ['equals', 'not_equals', 'contains', 'not_contains'],
  vendor: ['equals', 'not_equals', 'contains', 'not_contains'],
  tag: ['equals', 'not_equals'],
  variant_price: ['greater_than', 'less_than', 'equals'],
  compare_at_price: ['is_set', 'is_not_set', 'greater_than', 'less_than'],
  inventory_available: ['greater_than', 'less_than'],
  option_value: ['equals', 'not_equals'],
}

export const NUMERIC_RULE_FIELDS: readonly CollectionRuleField[] = [
  'variant_price',
  'compare_at_price',
  'inventory_available',
]

export const VALUELESS_RULE_OPERATORS: readonly CollectionRuleOperator[] = ['is_set', 'is_not_set']

export const MAX_COLLECTION_RULES = 60

export type CollectionRuleData = {
  field: CollectionRuleField
  operator: CollectionRuleOperator
  value: string | null
}

/**
 * One condition of an automated collection. A product belongs to the
 * collection when all (or any, per `collections.match`) rules match.
 */
export default class CollectionRule extends BaseAppModel {
  @column()
  declare collectionId: string

  @column()
  declare field: CollectionRuleField

  @column()
  declare operator: CollectionRuleOperator

  @column()
  declare value: string | null

  @column()
  declare position: number
}
