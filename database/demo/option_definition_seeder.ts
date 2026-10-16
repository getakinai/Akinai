import { BaseSeeder } from '@adonisjs/lucid/seeders'
import OptionDefinition from '#models/option_definition'
import OptionDefinitionValue from '#models/option_definition_value'

/**
 * Sample Storage and Color options for the tech demo store
 * (`node ace seed:demo-store`). Safe to re-run.
 */
export default class OptionDefinitionSeeder extends BaseSeeder {
  async run() {
    const storage = await OptionDefinition.firstOrCreate(
      { name: 'Storage' },
      { position: 0, isActive: true }
    )
    const color = await OptionDefinition.firstOrCreate(
      { name: 'Color' },
      { position: 1, isActive: true }
    )

    for (const [definition, values] of [
      [storage, ['128GB', '256GB', '512GB', '1TB']],
      [
        color,
        [
          'Black',
          'Blue',
          'Ultramarine',
          'Natural Titanium',
          'White Titanium',
          'Desert Titanium',
          'Space Gray',
          'Space Black',
          'Silver',
          'Starlight',
          'White',
        ],
      ],
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
