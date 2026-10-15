import { useEffect, useRef } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Minus, Plus, Printer, ShoppingBasket, Trash2, X } from 'lucide-react'
import { useCart } from 'snappycart'
import { cn, storefront } from '~/lib/styles'
import CartPrintSheet, { PRINT_CART_CLASS } from './cart_print_sheet'
import ImagePlaceholder from './image_placeholder'

type CartDrawerProps = {
  open: boolean
  onClose: () => void
  formatPrice: (amount: number) => string
  /** Shown under the subtotal, e.g. "Incl. GST". */
  priceNote?: string | null
  /** Branding for the printed cart. */
  storeName: string
  logoUrl?: string | null
}

export default function CartDrawer({
  open,
  onClose,
  formatPrice,
  priceNote,
  storeName,
  logoUrl,
}: CartDrawerProps) {
  const { items, increment, decrement, removeItem, clear, subtotal, totalItems } = useCart()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close cart"
          className="fixed inset-0 z-30 bg-sf-text/30 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}
      <aside
        id="storefront-cart"
        role="dialog"
        aria-modal="true"
        aria-labelledby="storefront-cart-title"
        aria-hidden={!open}
        inert={!open}
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-[min(380px,100vw)] flex-col border-l border-sf-line bg-sf-surface text-sf-text transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-16 flex-none items-center justify-between gap-2 border-b border-sf-line px-4">
          <h2 id="storefront-cart-title" className="min-w-0 truncate text-[15px] font-semibold">
            Your cart ({totalItems})
          </h2>
          <div className="flex flex-none items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                className={storefront.iconButton}
                onClick={printCart}
                aria-label="Print or save cart as PDF"
                title="Print or save as PDF"
              >
                <Printer size={18} />
              </button>
            )}
            <button
              ref={closeRef}
              type="button"
              className={storefront.iconButton}
              onClick={onClose}
              aria-label="Close cart"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-sf-primary-soft text-sf-primary">
              <ShoppingBasket size={20} />
            </span>
            <p className="text-[15px] font-semibold">Your cart is empty</p>
            <p className="text-[13.5px] text-sf-muted">Add some fresh picks to get started.</p>
            <button
              type="button"
              className={cn(storefront.primaryButton, 'mt-1')}
              onClick={onClose}
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="flex min-h-0 flex-1 flex-col divide-y divide-sf-line overflow-y-auto px-4">
              {items.map(({ product, quantity }) => {
                const vendor =
                  typeof product.metadata?.vendor === 'string' ? product.metadata.vendor : null
                return (
                  <li key={String(product.id)} className="flex min-w-0 gap-3 py-4">
                    <div className="size-16 flex-none overflow-hidden rounded-lg">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt=""
                          width={64}
                          height={64}
                          loading="lazy"
                          className="size-full bg-sf-text/5 object-cover"
                        />
                      ) : (
                        <ImagePlaceholder className="h-full" iconSize={16} />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {vendor && (
                            <span className="block truncate text-[12px] text-sf-muted">
                              {vendor}
                            </span>
                          )}
                          <p
                            className="truncate text-[14px] leading-snug font-medium"
                            title={product.name}
                          >
                            {product.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={cn(
                            storefront.iconButton,
                            'size-9 flex-none border-transparent'
                          )}
                          onClick={() => removeItem(product.id)}
                          aria-label={`Remove ${product.name} from cart`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                        <div
                          className="flex items-center gap-1.5"
                          role="group"
                          aria-label={`Quantity for ${product.name}`}
                        >
                          <button
                            type="button"
                            className={cn(storefront.iconButton, 'size-9')}
                            onClick={() => decrement(product.id)}
                            aria-label={`Decrease quantity of ${product.name}`}
                          >
                            <Minus size={15} />
                          </button>
                          <span className="min-w-6 text-center text-[14px] font-medium tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            className={cn(storefront.iconButton, 'size-9')}
                            onClick={() => increment(product.id)}
                            aria-label={`Increase quantity of ${product.name}`}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-[14.5px] font-semibold text-sf-primary">
                            {formatPrice(product.price * quantity)}
                          </div>
                          {quantity > 1 && (
                            <div className="text-[12px] text-sf-muted">
                              {formatPrice(product.price)} each
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="flex flex-none flex-col gap-3 border-t border-sf-line p-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2 text-[15px]">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                {priceNote && (
                  <p className="text-right text-[12px] text-sf-muted">
                    {priceNote}, shipping calculated at checkout
                  </p>
                )}
              </div>
              <Link
                route="storefront.checkout.home"
                className={cn(storefront.primaryButton, 'w-full')}
                onClick={onClose}
              >
                Checkout
              </Link>
              <button
                type="button"
                className="self-center text-[13px] font-medium text-sf-muted underline-offset-2 hover:text-sf-text hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
                onClick={clear}
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </aside>

      {open && (
        <CartPrintSheet
          storeName={storeName}
          logoUrl={logoUrl}
          formatPrice={formatPrice}
          priceNote={priceNote}
        />
      )}
    </>
  )
}

function printCart() {
  const body = document.body
  body.classList.add(PRINT_CART_CLASS)
  window.addEventListener('afterprint', () => body.classList.remove(PRINT_CART_CLASS), {
    once: true,
  })
  window.print()
}
