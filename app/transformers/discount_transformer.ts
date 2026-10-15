import type Discount from '#models/discount'
import type { DiscountTargetRole } from '#models/discount_target'
import { BaseTransformer } from '@adonisjs/core/transformers'

type TargetItem = { id: string; title: string }

type TargetGroup = { products: TargetItem[]; collections: TargetItem[] }

export default class DiscountTransformer extends BaseTransformer<Discount> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'title',
        'type',
        'code',
        'method',
        'valueType',
        'value',
        'appliesTo',
        'buyRequirement',
        'buyValue',
        'buyAppliesTo',
        'getQuantity',
        'maxUsesPerOrder',
        'maxShippingPrice',
        'minSubtotal',
        'usageLimit',
        'usageCount',
        'oncePerCustomer',
        'startsAt',
        'endsAt',
        'archivedAt',
        'createdAt',
        'updatedAt',
      ]),
      status: this.resource.statusAt(),
      targets: this.targets(),
    }
  }

  /** Targets grouped by role, with titles; null when they weren't loaded (lists). */
  protected targets(): Record<DiscountTargetRole, TargetGroup> | null {
    if (!('targets' in this.resource.$preloaded)) return null
    const groups: Record<DiscountTargetRole, TargetGroup> = {
      applies: { products: [], collections: [] },
      buy: { products: [], collections: [] },
      get: { products: [], collections: [] },
    }
    for (const target of this.resource.targets) {
      const group = groups[target.role]
      if (target.productId && target.product) {
        group.products.push({ id: target.productId, title: target.product.title })
      } else if (target.collectionId && target.collection) {
        group.collections.push({ id: target.collectionId, title: target.collection.title })
      }
    }
    return groups
  }
}
