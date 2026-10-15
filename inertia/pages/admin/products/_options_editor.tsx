/**
 * Shared helpers for product option form errors (catalog picker lives in _options_picker).
 */
export function optionsError(errors: Record<string, string>): string | undefined {
  const key = Object.keys(errors).find((name) => name === 'options' || name.startsWith('options.'))
  return key ? errors[key] : undefined
}
