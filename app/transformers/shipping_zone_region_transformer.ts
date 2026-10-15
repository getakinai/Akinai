import type ShippingZoneRegion from '#models/shipping_zone_region'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * A region assigned to a zone. Needs the `zone` preload.
 */
export default class ShippingZoneRegionTransformer extends BaseTransformer<ShippingZoneRegion> {
  toObject() {
    return {
      regionCode: this.resource.regionCode,
      zoneId: this.resource.shippingZoneId,
      zoneName: this.resource.zone.name,
    }
  }
}
