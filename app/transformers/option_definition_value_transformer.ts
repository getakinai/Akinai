import type OptionDefinitionValue from '#models/option_definition_value'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class OptionDefinitionValueTransformer extends BaseTransformer<OptionDefinitionValue> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'optionDefinitionId',
      'value',
      'position',
      'createdAt',
      'updatedAt',
    ])
  }
}
