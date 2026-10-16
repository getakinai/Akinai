import { type ReactNode } from 'react'
import { ImagePlaceholder } from '~/components/storefront'
import { Skeleton } from '~/components/ui'
import { cn } from '~/lib/styles'

export type OrderSummaryLine = {
  key: string
  title: string
  subtitle?: string | null
  quantity: number
  lineTotal: string
  imageUrl?: string | null
}

type OrderSummaryProps = {
  lines: OrderSummaryLine[]
  subtotal: string | null
  discount?: string | null
  discountLabel?: string
  /** Discount code entry, shown between the lines and the totals. */
  discountForm?: ReactNode
  /** Formatted price before any shipping discount, or a hint such as "Enter shipping address". */
  shipping: string
  shippingIsHint?: boolean
  shippingDiscount?: string | null
  shippingDiscountLabel?: string
  tax?: { label: string; amount: string } | null
  total: string | null
  currencyCode: string
  className?: string
  /** Caps the line list height in the collapsible mobile summary. */
  compact?: boolean
}

export default function OrderSummary({
  lines,
  subtotal,
  discount,
  discountLabel = 'Discount',
  discountForm,
  shipping,
  shippingIsHint = false,
  shippingDiscount,
  shippingDiscountLabel = 'Free shipping',
  tax,
  total,
  currencyCode,
  className,
  compact = false,
}: OrderSummaryProps) {
  return (
    <div className={cn('flex min-h-0 min-w-0 flex-col gap-4', className)}>
      <ul
        className={cn(
          'flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain pt-2 pr-1',
          compact && 'max-h-[45dvh]'
        )}
      >
        {lines.map((line) => (
          <li key={line.key} className="flex min-w-0 items-center gap-3">
            <div className="relative flex-none">
              <div className="size-16 overflow-hidden rounded-lg border border-sf-line bg-sf-surface">
                {line.imageUrl ? (
                  <img
                    src={line.imageUrl}
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
              <span className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-sf-text px-1 text-[11px] font-semibold text-sf-surface tabular-nums">
                {line.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[14px] font-medium">{line.title}</p>
              {line.subtitle && (
                <p className="truncate text-[12.5px] text-sf-muted">{line.subtitle}</p>
              )}
            </div>
            <span className="flex-none text-[14px] tabular-nums">{line.lineTotal}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-none flex-col gap-5 border-t border-sf-line pt-4">
        {discountForm}

        <dl className="flex flex-col gap-2 text-[14px]">
          <div className="flex items-center justify-between gap-3">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{subtotal ?? <Skeleton className="h-4 w-16" />}</dd>
          </div>
          {discount && (
            <div className="flex items-center justify-between gap-3">
              <dt className="min-w-0 truncate">{discountLabel}</dt>
              <dd className="tabular-nums">−{discount}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <dt>Shipping</dt>
            <dd
              className={shippingIsHint ? 'text-right text-[13px] text-sf-muted' : 'tabular-nums'}
            >
              {shipping}
            </dd>
          </div>
          {shippingDiscount && (
            <div className="flex items-center justify-between gap-3">
              <dt className="min-w-0 truncate">{shippingDiscountLabel}</dt>
              <dd className="tabular-nums">−{shippingDiscount}</dd>
            </div>
          )}
          {tax && (
            <div className="flex items-center justify-between gap-3">
              <dt>{tax.label}</dt>
              <dd className="tabular-nums">{tax.amount}</dd>
            </div>
          )}
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <dt className="text-[17px] font-semibold">Total</dt>
            <dd className="flex items-baseline gap-2">
              <span className="text-[12px] text-sf-muted">{currencyCode}</span>
              <span className="text-[19px] font-semibold tabular-nums">
                {total ?? <Skeleton className="h-5 w-20" />}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
