import vine from '@vinejs/vine'

export const MAX_PRODUCT_OPTIONS = 3

export const MAX_PRODUCT_VARIANTS = 100

type RawOption = { name?: unknown; values?: unknown }

const normalize = (value: unknown) => String(value).trim().toLowerCase()

/**
 * Option names and the values within each option must be unique ignoring
 * case, and the options may not resolve to more than MAX_PRODUCT_VARIANTS.
 */
const productOptionsRule = vine.createRule((value, _options, field) => {
  if (!field.isValid || !Array.isArray(value)) return

  const options = value as RawOption[]
  const names = options.map(({ name }) => normalize(name))
  if (new Set(names).size !== names.length) {
    field.report('Each option needs a different name', 'distinctOptionNames', field)
    return
  }

  for (const option of options) {
    const values = Array.isArray(option.values) ? option.values.map(normalize) : []
    if (new Set(values).size !== values.length) {
      field.report(
        `The values of "${String(option.name)}" must be different`,
        'distinctOptionValues',
        field
      )
      return
    }
  }

  const combinations = options.reduce(
    (total, option) => total * (Array.isArray(option.values) ? option.values.length : 0),
    1
  )
  if (combinations > MAX_PRODUCT_VARIANTS) {
    field.report(
      `These options create ${combinations} variants. The limit is ${MAX_PRODUCT_VARIANTS}.`,
      'maxVariants',
      field
    )
  }
})

export function productOptionsSchema() {
  return vine
    .array(
      vine.object({
        name: vine.string().trim().minLength(1).maxLength(64),
        values: vine
          .array(vine.string().trim().minLength(1).maxLength(64))
          .minLength(1)
          .maxLength(MAX_PRODUCT_VARIANTS),
      })
    )
    .maxLength(MAX_PRODUCT_OPTIONS)
    .use(productOptionsRule())
}
