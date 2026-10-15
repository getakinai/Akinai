/** "Discount (SUMMER10)", or the automatic discount's title. */
export function discountLabel(code: string | null, title: string | null) {
  if (code) return `Discount (${code})`
  return title ? `Discount (${title})` : 'Discount'
}

/** "Free shipping (Holiday shipping)" for the shipping discount row. */
export function shippingDiscountLabel(title: string | null) {
  return title ? `Free shipping (${title})` : 'Free shipping'
}
