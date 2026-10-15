import { createPortal } from 'react-dom'
import { useCart } from 'snappycart'

/** Added to `<body>` while printing so only the sheet shows (see `app.css`). */
export const PRINT_CART_CLASS = 'print-cart'

type CartPrintSheetProps = {
  storeName: string
  logoUrl?: string | null
  formatPrice: (amount: number) => string
  priceNote?: string | null
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' })

/**
 * A plain, printable copy of the cart, hidden on screen. Rendered at the
 * top of `<body>` so the print stylesheet can hide everything else.
 */
export default function CartPrintSheet({
  storeName,
  logoUrl,
  formatPrice,
  priceNote,
}: CartPrintSheetProps) {
  const { items, subtotal, totalItems } = useCart()
  if (items.length === 0) return null

  return createPortal(
    <section className="cart-print-sheet hidden bg-white p-8 text-[12pt] text-neutral-900 print:block">
      <header className="flex items-center justify-between gap-6 border-b border-neutral-300 pb-4">
        <div className="flex items-center gap-3">
          {logoUrl && <img src={logoUrl} alt="" className="h-12 w-auto" />}
          <span className="text-[16pt] font-semibold">{storeName}</span>
        </div>
        <div className="text-right">
          <p className="text-[14pt] font-semibold">Shopping cart</p>
          <p className="text-[10pt] text-neutral-600">{dateFormat.format(new Date())}</p>
        </div>
      </header>

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="border-b border-neutral-300 text-left text-[10pt] text-neutral-600">
            <th className="py-2 pr-4 font-medium">Item</th>
            <th className="py-2 pr-4 text-right font-medium">Qty</th>
            <th className="py-2 pr-4 text-right font-medium">Price</th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ product, quantity }) => {
            const vendor =
              typeof product.metadata?.vendor === 'string' ? product.metadata.vendor : null
            return (
              <tr key={String(product.id)} className="border-b border-neutral-200 align-top">
                <td className="py-2 pr-4">
                  <span className="block font-medium">{product.name}</span>
                  {vendor && <span className="block text-[10pt] text-neutral-600">{vendor}</span>}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{quantity}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatPrice(product.price)}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatPrice(product.price * quantity)}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-4 pr-4 font-semibold" colSpan={3}>
              Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </td>
            <td className="pt-4 text-right font-semibold tabular-nums">{formatPrice(subtotal)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-4 text-[10pt] text-neutral-600">
        {priceNote ? `${priceNote}. ` : ''}Shipping is calculated at checkout. Prices may change
        until the order is placed.
      </p>
    </section>,
    document.body
  )
}
