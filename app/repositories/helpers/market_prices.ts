/**
 * The market whose prices a query reads. The primary market uses the
 * variant's own price; other markets use `product_variant_prices` rows, and
 * a variant without a row has no price (cannot be bought) in that market.
 */
export type PriceMarket = { id: string; isPrimary: boolean }

export type VariantPriceSource = {
  /** `FROM` clause exposing the variant as `pv`. */
  from: string
  price: string
  compareAt: string
  bindings: string[]
}

export function variantPriceSource(market: PriceMarket): VariantPriceSource {
  if (market.isPrimary) {
    return {
      from: 'product_variants pv',
      price: 'pv.price',
      compareAt: 'pv.compare_at_price',
      bindings: [],
    }
  }
  return {
    from: 'product_variants pv join product_variant_prices vp on vp.product_variant_id = pv.id and vp.market_id = ?',
    price: 'vp.price',
    compareAt: 'vp.compare_at_price',
    bindings: [market.id],
  }
}

/**
 * Correlated subqueries (against `products`) for a product's lowest and
 * highest price, and the compare-at price and id of its cheapest variant,
 * in the market.
 */
export function productPriceSubqueries(market: PriceMarket) {
  const { from, price, compareAt, bindings } = variantPriceSource(market)
  const cheapest = (column: string) =>
    `(select ${column} from ${from} where pv.product_id = products.id order by ${price} asc, pv.id asc limit 1)`

  return {
    priceMin: {
      sql: `(select min(${price}) from ${from} where pv.product_id = products.id)`,
      bindings,
    },
    priceMax: {
      sql: `(select max(${price}) from ${from} where pv.product_id = products.id)`,
      bindings,
    },
    compareAt: { sql: cheapest(compareAt), bindings },
    variantId: { sql: cheapest('pv.id'), bindings },
  }
}
