const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' })

/**
 * ISO 4217 currencies known to the runtime, for currency pickers.
 */
export const CURRENCY_OPTIONS = Intl.supportedValuesOf('currency').map((code) => {
  const name = currencyNames.of(code) ?? code
  return { value: code, label: `${code} · ${name}`, searchText: `${code} ${name}` }
})
