import { BaseSeeder } from '@adonisjs/lucid/seeders'
import OptionDefinition from '#models/option_definition'
import OptionDefinitionValue from '#models/option_definition_value'

/**
 * Sample Size and Color options. Part of the demo store
 * (`node ace seed:demo-store`). Safe to re-run.
 */
export default class OptionDefinitionSeeder extends BaseSeeder {
  async run() {
    const size = await OptionDefinition.firstOrCreate(
      { name: 'Size' },
      { position: 0, isActive: true }
    )
    const color = await OptionDefinition.firstOrCreate(
      { name: 'Color' },
      { position: 1, isActive: true }
    )

    for (const [definition, values] of [
      [size, ['S', 'M', 'L']],
      [color, ['Red', 'Blue', 'Black']],
    ] as const) {
      for (const [position, value] of values.entries()) {
        await OptionDefinitionValue.firstOrCreate(
          { optionDefinitionId: definition.id, value },
          { position }
        )
      }
    }
  }
}
