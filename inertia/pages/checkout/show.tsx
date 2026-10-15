import { useEffect, useRef } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { ArrowLeft, Building2, CircleCheck, Clock, CreditCard, Landmark } from 'lucide-react'
import { FormButton } from '~/components/form'
import { Badge, Skeleton } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import { useClearCart } from '~/hooks/use_cart_persistence'
import CheckoutLayout from '~/layouts/checkout'
import { countryName } from '~/lib/countries'
import { HttpError } from '~/lib/http'
import { FALLBACK_MONEY, formatMoney } from '~/lib/money'
import { cn, storefront } from '~/lib/styles'
import { useStoreSettings, useStorefrontSession } from '~/pages/_hooks'
import BankDetails from './_bank_details'
import { discountLabel, shippingDiscountLabel } from './_discount_labels'
import { customerFulfillmentMeta } from './_fulfillment'
import Shipments from './_shipments'
import { useCheckoutOrder, usePayOrder } from './_hooks'
import { isOnlinePayment } from './_types'
import OrderDocuments from './_order_documents'
import OrderSummary from './_order_summary'
import OrderRefunds, { customerPaymentMeta } from './_refunds'

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  stripe: 'Card',
  poli: 'POLi',
}

export default function CheckoutShow({
  id,
  paymentFailed = false,
}: {
  id: string
  paymentFailed?: boolean
}) {
  const { formatOrderDate } = useDateFormat()
  const { data: order, isLoading, isError, error } = useCheckoutOrder(id)
  const expired = error instanceof HttpError && error.status === 410
  const { data: session } = useStorefrontSession()
  const { data: settings } = useStoreSettings()
  const bankTransfer = order?.bankTransfer ?? null
  const payOrder = usePayOrder(id)
  const clearCart = useClearCart()
  const cleared = useRef(false)

  useEffect(() => {
    if (cleared.current) return
    cleared.current = true
    clearCart()
  }, [clearCart])

  const money = {
    ...(settings ?? FALLBACK_MONEY),
    currencyCode: order?.currencyCode ?? settings?.currencyCode ?? FALLBACK_MONEY.currencyCode,
  }
  const format = (amount: number) => formatMoney(amount, money)
  const address = order?.shippingAddress
  const reference = order?.bankReference ?? null
  const shipping = order ? customerFulfillmentMeta(order.fulfillmentStatus) : null

  return (
    <div className={cn(storefront.container, 'flex flex-col gap-6 py-8 sm:py-12')}>
      <Head title={order?.orderNumber ? `Order #${order.orderNumber}` : 'Thank you'} />
      {session?.signedIn ? (
        <Link
          route="customers.account.home"
          className="inline-flex w-fit items-center gap-1 text-[13px] text-sf-muted hover:text-sf-text"
        >
          <ArrowLeft size={12} /> My account
        </Link>
      ) : (
        <Link
          route="home"
          className="inline-flex w-fit items-center gap-1 text-[13px] text-sf-muted hover:text-sf-text"
        >
          <ArrowLeft size={12} /> Home
        </Link>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {isError && expired && (
        <div className={cn(storefront.card, 'flex flex-col items-center gap-3 p-8 text-center')}>
          <Clock size={32} strokeWidth={1.5} className="text-sf-muted" />
          <div>
            <p className="text-[16px] font-semibold">This confirmation link has expired</p>
            <p className="mt-1 text-[14px] text-sf-muted">
              {session?.signedIn
                ? 'You can still see this order and pay for it from your account.'
                : 'Sign in to your account to see this order.'}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {session?.signedIn ? (
              <Link
                route="customers.account.orders.show"
                routeParams={{ id }}
                className={storefront.primaryButton}
              >
                View order
              </Link>
            ) : (
              <Link route="customers.session.create" className={storefront.primaryButton}>
                Sign in
              </Link>
            )}
            <Link route="home" className={cn(storefront.iconButton, 'w-auto px-4 text-[14px]')}>
              Continue shopping
            </Link>
          </div>
        </div>
      )}

      {isError && !expired && (
        <div className={cn(storefront.card, 'p-8 text-center')}>
          <p className="text-[16px] font-semibold">We couldn’t find this order</p>
          <p className="mt-1 text-[14px] text-sf-muted">
            If you placed it on another device, sign in to your account to see it.
          </p>
        </div>
      )}

      {order && (
        <>
          <div className="flex items-start gap-3">
            <CircleCheck size={36} strokeWidth={1.5} className="flex-none text-sf-primary" />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-[13px] text-sf-muted">
                Order #{order.orderNumber}
                {order.cancelled && <Badge tone="danger">Cancelled</Badge>}
                {shipping && !order.cancelled && (
                  <Badge tone={shipping.tone}>{shipping.label}</Badge>
                )}
              </p>
              <h1 className="text-[24px] font-semibold tracking-[-0.015em]">Thank you!</h1>
              {order.email && (
                <p className="mt-1 text-[14px] text-sf-muted">
                  Your order is confirmed. We’ll contact you at {order.email} with updates.
                </p>
              )}
            </div>
          </div>

          {order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending' && (
            <div className="flex gap-3 rounded-lg border border-sf-line bg-sf-bg p-4 text-[14px]">
              <Landmark size={18} className="mt-0.5 flex-none text-sf-muted" />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <p>
                  Your order is on hold until we receive your bank transfer. Please pay{' '}
                  <strong>{format(order.total)}</strong> using <strong>{reference}</strong> as the
                  payment reference.
                </p>
                {bankTransfer ? (
                  <BankDetails bank={bankTransfer} reference={reference ?? undefined} />
                ) : (
                  <p className="text-sf-muted">Contact us for our bank details.</p>
                )}
              </div>
            </div>
          )}

          {isOnlinePayment(order.paymentMethod) && order.paymentStatus === 'pending' && (
            <div className="flex gap-3 rounded-lg border border-sf-line bg-sf-bg p-4 text-[14px]">
              {order.paymentMethod === 'poli' ? (
                <Building2 size={18} className="mt-0.5 flex-none text-sf-muted" />
              ) : (
                <CreditCard size={18} className="mt-0.5 flex-none text-sf-muted" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                {paymentFailed && !payOrder.isPending ? (
                  <p role="alert" className="text-danger">
                    Your order is saved, but we couldn’t open the payment page. Pay{' '}
                    <strong>{format(order.total)}</strong> now to confirm your order.
                  </p>
                ) : (
                  <p>
                    We haven’t received your {order.paymentMethod === 'poli' ? 'POLi' : 'card'}{' '}
                    payment of <strong>{format(order.total)}</strong> yet. If you’ve just paid, this
                    can take a moment to update. Otherwise, pay now to confirm your order.
                  </p>
                )}
                <FormButton
                  type="button"
                  className="w-full sm:w-fit"
                  loading={payOrder.isPending}
                  loadingText={order.paymentMethod === 'poli' ? 'Opening POLi…' : 'Opening Stripe…'}
                  onClick={() => payOrder.mutate()}
                >
                  Pay now
                </FormButton>
                {payOrder.isError && (
                  <p className="text-[13px] text-danger">
                    We couldn’t open the payment page. Please try again.
                  </p>
                )}
              </div>
            </div>
          )}

          <div
            className={cn(storefront.card, 'grid grid-cols-1 gap-5 p-5 text-[14px] sm:grid-cols-2')}
          >
            {address && (
              <div className="min-w-0">
                <h2 className="mb-1 font-semibold">Shipping address</h2>
                <p className="text-sf-muted">
                  {[
                    address.fullName,
                    address.address1,
                    address.address2,
                    [address.city, address.province, address.postalCode].filter(Boolean).join(' '),
                    countryName(address.countryCode),
                  ]
                    .filter(Boolean)
                    .map((line) => (
                      <span key={line} className="block break-words">
                        {line}
                      </span>
                    ))}
                </p>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="mb-1 font-semibold">Shipping method</h2>
              <p className="text-sf-muted">{order.shippingTitle ?? '—'}</p>
              <h2 className="mt-3 mb-1 font-semibold">Payment</h2>
              <p className="text-sf-muted">
                {PAYMENT_LABELS[order.paymentMethod ?? ''] ?? '—'} ·{' '}
                {customerPaymentMeta(order.paymentStatus).label}
              </p>
            </div>
          </div>

          <OrderRefunds order={order} money={format} formatDate={formatOrderDate} />

          <Shipments shipments={order.fulfillments} formatDate={formatOrderDate} />

          <OrderDocuments order={order} baseUrl={`/checkout/orders/${order.id}`} />

          <div className="rounded-card bg-sf-bg p-5">
            <OrderSummary
              lines={order.lineItems.map((line) => ({
                key: line.id,
                title: line.productTitle,
                subtitle: line.variantTitle,
                quantity: line.quantity,
                lineTotal: format(line.lineTotal),
              }))}
              subtotal={format(order.subtotal)}
              discount={order.discountTotal > 0 ? format(order.discountTotal) : null}
              discountLabel={discountLabel(order.discountCode, order.discountTitle)}
              shipping={format(order.shippingTotal + order.shippingDiscountTotal)}
              shippingDiscount={
                order.shippingDiscountTotal > 0 ? format(order.shippingDiscountTotal) : null
              }
              shippingDiscountLabel={shippingDiscountLabel(order.shippingDiscountTitle)}
              tax={
                order.taxTotal > 0
                  ? {
                      label: order.pricesIncludeTax
                        ? `Includes ${order.taxName ?? 'tax'}`
                        : (order.taxName ?? 'Tax'),
                      amount: format(order.taxTotal),
                    }
                  : null
              }
              total={format(order.total)}
              currencyCode={order.currencyCode}
            />
          </div>

          <Link route="home" className={cn(storefront.primaryButton, 'w-full sm:w-fit')}>
            Continue shopping
          </Link>
        </>
      )}
    </div>
  )
}

CheckoutShow.layout = [CheckoutLayout]
