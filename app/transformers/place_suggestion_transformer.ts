import type { PlaceSuggestion } from '#services/google_places_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class PlaceSuggestionTransformer extends BaseTransformer<PlaceSuggestion> {
  toObject() {
    return {
      placeId: this.resource.placeId,
      description: this.resource.description,
      mainText: this.resource.mainText,
    }
  }
}
