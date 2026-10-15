import type OptionDefinition from '#models/option_definition'
import OptionDefinitionValueTransformer from '#transformers/option_definition_value_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class OptionDefinitionTransformer extends BaseTransformer<OptionDefinition> {
  toObject() {
    const { $extras } = this.resource
    return {
      ...this.pick(this.resource, ['id', 'name', 'position', 'isActive', 'createdAt', 'updatedAt']),
      valuesCount: $extras.values_count !== undefined ? Number($extras.values_count) : null,
    }
  }

  toDetail() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'position', 'isActive', 'createdAt', 'updatedAt']),
      values: OptionDefinitionValueTransformer.transform(this.resource.values),
    }
  }

  toCatalog() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      values: OptionDefinitionValueTransformer.transform(this.resource.values),
    }
  }
}
