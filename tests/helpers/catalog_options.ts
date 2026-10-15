import app from '@adonisjs/core/services/app'
import OptionDefinitionService from '#services/option_definition_service'

export type CatalogFixture = {
  sizeId: string
  sizeValues: { S: string; M: string; L: string }
  colorId: string
  colorValues: { Red: string; Blue: string }
}

/**
 * Ensures Size and Color options exist for product tests.
 */
export async function ensureCatalogOptions(): Promise<CatalogFixture> {
  const service = await app.container.make(OptionDefinitionService)
  let size = (await service.catalog()).find(({ name }) => name === 'Size')
  if (!size) {
    size = await service.findDetailOrFail((await service.create('Size')).id)
  }
  const ensureValue = async (definitionId: string, label: string) => {
    const detail = await service.findDetailOrFail(definitionId)
    const existing = detail.values.find((entry) => entry.value === label)
    if (existing) return existing.id
    return (await service.addValue(definitionId, label)).id
  }

  let color = (await service.catalog()).find(({ name }) => name === 'Color')
  if (!color) {
    color = await service.findDetailOrFail((await service.create('Color')).id)
  }

  const s = await ensureValue(size.id, 'S')
  const m = await ensureValue(size.id, 'M')
  const l = await ensureValue(size.id, 'L')
  const red = await ensureValue(color.id, 'Red')
  const blue = await ensureValue(color.id, 'Blue')

  return {
    sizeId: size.id,
    sizeValues: { S: s, M: m, L: l },
    colorId: color.id,
    colorValues: { Red: red, Blue: blue },
  }
}

export function sizeOnlyOptions(catalog: CatalogFixture, values: ('S' | 'M' | 'L')[]) {
  return [
    {
      optionDefinitionId: catalog.sizeId,
      optionDefinitionValueIds: values.map((v) => catalog.sizeValues[v]),
    },
  ]
}

export function sizeAndColorOptions(
  catalog: CatalogFixture,
  size: ('S' | 'M' | 'L')[],
  color: ('Red' | 'Blue')[]
) {
  return [
    {
      optionDefinitionId: catalog.sizeId,
      optionDefinitionValueIds: size.map((v) => catalog.sizeValues[v]),
    },
    {
      optionDefinitionId: catalog.colorId,
      optionDefinitionValueIds: color.map((v) => catalog.colorValues[v]),
    },
  ]
}

export type CatalogOptionFixture = {
  definitionId: string
  values: Record<string, string>
}

export type CatalogOptionSelection = {
  optionDefinitionId: string
  optionDefinitionValueIds: string[]
}

/** Ensures an active catalog option and the given value labels exist. */
export async function ensureOptionDefinition(
  name: string,
  labels: string[]
): Promise<CatalogOptionFixture> {
  const service = await app.container.make(OptionDefinitionService)
  let definition = (await service.catalog()).find((entry) => entry.name === name)
  if (!definition) {
    definition = await service.findDetailOrFail((await service.create(name)).id)
  }

  const values: Record<string, string> = {}
  for (const label of labels) {
    let detail = await service.findDetailOrFail(definition.id)
    const existing = detail.values.find((entry) => entry.value === label)
    values[label] = existing
      ? existing.id
      : (await service.addValue(definition.id, label)).id
  }

  return { definitionId: definition.id, values }
}

export function pickCatalogOptions(
  fixture: CatalogOptionFixture,
  labels: string[]
): CatalogOptionSelection {
  return {
    optionDefinitionId: fixture.definitionId,
    optionDefinitionValueIds: labels.map((label) => fixture.values[label]),
  }
}
