import type { PlaceAddress } from '#services/google_places_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class PlaceAddressTransformer extends BaseTransformer<PlaceAddress> {
  toObject() {
    return {
      address1: this.resource.address1,
      address2: this.resource.address2,
      suburb: this.resource.suburb,
      city: this.resource.city,
      region: this.resource.region,
      postalCode: this.resource.postalCode,
      countryCode: this.resource.countryCode,
    }
  }
}
