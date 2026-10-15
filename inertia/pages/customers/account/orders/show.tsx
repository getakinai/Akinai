import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, Building2, CreditCard, Landmark } from 'lucide-react'
import { FormButton } from '~/components/form'
import { Badge, Skeleton } from '~/components/ui'
import AccountLayout from '~/layouts/account'
import StorefrontLayout from '~/layouts/storefront'
import { countryName } from '~/lib/countries'
import { cn, storefront } from '~/lib/styles'
import BankDetails from '~/pages/checkout/_bank_details'
import { discountLabel, shippingDiscountLabel } from '~/pages/checkout/_discount_labels'
import { customerFulfillmentMeta } from '~/pages/checkout/_fulfillment'
import Shipments from '~/pages/checkout/_shipments'
import { usePayOrder } from '~/pages/checkout/_hooks'
import { isOnlinePayment } from '~/pages/checkout/_types'
import OrderDocuments from '~/pages/checkout/_order_documents'
import OrderSummary from '~/pages/checkout/_order_summary'
import OrderRefunds, { customerPaymentMeta } from '~/pages/checkout/_refunds'
import { useCustomerOrder } from '../../_hooks'
import AccountPage from '../_account_page'
import { useAccountFormat } from '../_format'
import NotesSection from './_notes_section'
import PaymentProofSection from './_payment_proof_section'
import ReturnsSection from './_returns_section'

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  stripe: 'Card',
  poli: 'POLi',
}

export default function CustomerAccountOrdersShow({ id }: { id: string }) {
  const { data: order, isLoading, isError } = useCustomerOrder(id)
  const payOrder = usePayOrder(id)
  const format = useAccountFormat()
  const bankTransfer = order?.bankTransfer ?? null

  const money = (amount: number) => format.money(amount, order?.currencyCode ?? 'NZD')
  const awaitingPayment = order?.paymentStatus === 'pending' && !order.cancelled
  const payment = customerPaymentMeta(order?.paymentStatus ?? null)
  const address = order?.shippingAddress
  const title = order?.orderNumber ? `Order #${order.orderNumber}` : 'Order'
  const reference = order?.bankReference ?? null
  const shipping = order ? customerFulfillmentMeta(order.fulfillmentStatus) : null

  return (
    <AccountPage
      title={title}
      heading={isLoading ? <Skeleton className="h-8 w-40" /> : title}
      eyebrow={
        <Link
          route="customers.account.orders.home"
          className="inline-flex items-center gap-1 hover:text-sf-text"
        >
          <ArrowLeft size={12} /> Orders
        </Link>
      }
      description={order?.completedAt ? `Placed ${format.orderDate(order.completedAt)}` : undefined}
      actions={
        order && (
          <div className="flex flex-wrap gap-2">
            {order.cancelled && <Badge tone="danger">Cancelled</Badge>}
            <Badge tone={payment.tone}>{payment.label}</Badge>
            {shipping && !order.cancelled && <Badge tone={shipping.tone}>{shipping.label}</Badge>}
          </div>
        )
      }
    >
      {isLoading && <Skeleton className="h-64 w-full rounded-card" />}

      {isError && (
        <div className={cn(storefront.card, 'p-8 text-center')}>
          <p className="text-[16px] font-semibold">We couldn’t find this order</p>
          <p className="mt-1 text-[14px] text-sf-muted">It may belong to a different account.</p>
        </div>
      )}

      {order && (
        <>
          {order.paymentMethod === 'bank_transfer' && awaitingPayment && (
            <div className={cn(storefront.card, 'flex gap-3 p-4 text-[14px]')}>
              <Landmark size={18} className="mt-0.5 flex-none text-sf-muted" />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <p>
                  Your order is on hold until we receive your bank transfer. Please pay{' '}
                  <strong>{money(order.total)}</strong> using <strong>{reference}</strong> as the
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

          <PaymentProofSection order={order} formatDate={format.date} />

          {isOnlinePayment(order.paymentMethod) && awaitingPayment && (
            <div className={cn(storefront.card, 'flex gap-3 p-4 text-[14px]')}>
              {order.paymentMethod === 'poli' ? (
                <Building2 size={18} className="mt-0.5 flex-none text-sf-muted" />
              ) : (
                <CreditCard size={18} className="mt-0.5 flex-none text-sf-muted" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <p>
                  We haven’t received your {order.paymentMethod === 'poli' ? 'POLi' : 'card'}{' '}
                  payment of <strong>{money(order.total)}</strong> yet. Pay now to confirm your
                  order.
                </p>
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
            <div className="min-w-0">
              <h2 className="mb-1 font-semibold">Shipping address</h2>
              {address ? (
                <p className="text-sf-muted">
                  {[
                    address.fullName,
                    address.address1,
                    address.address2,
                    [address.city, address.province, address.postalCode].filter(Boolean).join(' '),
                    countryName(address.countryCode),
                    address.phone,
                  ]
                    .filter(Boolean)
                    .map((line) => (
                      <span key={line} className="block break-words">
                        {line}
                      </span>
                    ))}
                </p>
              ) : (
                <p className="text-sf-muted">—</p>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="mb-1 font-semibold">Shipping method</h2>
              <p className="text-sf-muted">{order.shippingTitle ?? '—'}</p>
              <h2 className="mt-3 mb-1 font-semibold">Payment</h2>
              <p className="text-sf-muted">
                {PAYMENT_LABELS[order.paymentMethod ?? ''] ?? '—'} · {payment.label}
              </p>
            </div>
          </div>

          <OrderRefunds order={order} money={money} formatDate={format.date} />

          <Shipments shipments={order.fulfillments} formatDate={format.date} />

          <OrderDocuments order={order} baseUrl={`/account/orders/${order.id}`} />

          <NotesSection orderId={order.id} formatDate={format.date} />

          <ReturnsSection order={order} formatDate={format.date} />

          <div className="rounded-card border border-sf-line bg-sf-surface p-5">
            <OrderSummary
              lines={order.lineItems.map((line) => ({
                key: line.id,
                title: line.productTitle,
                subtitle: line.variantTitle,
                quantity: line.quantity,
                lineTotal: money(line.lineTotal),
              }))}
              subtotal={money(order.subtotal)}
              discount={order.discountTotal > 0 ? money(order.discountTotal) : null}
              discountLabel={discountLabel(order.discountCode, order.discountTitle)}
              shipping={money(order.shippingTotal + order.shippingDiscountTotal)}
              shippingDiscount={
                order.shippingDiscountTotal > 0 ? money(order.shippingDiscountTotal) : null
              }
              shippingDiscountLabel={shippingDiscountLabel(order.shippingDiscountTitle)}
              tax={
                order.taxTotal > 0
                  ? {
                      label: order.pricesIncludeTax
                        ? `Includes ${order.taxName ?? 'tax'}`
                        : (order.taxName ?? 'Tax'),
                      amount: money(order.taxTotal),
                    }
                  : null
              }
              total={money(order.total)}
              currencyCode={order.currencyCode}
            />
          </div>
        </>
      )}
    </AccountPage>
  )
}

CustomerAccountOrdersShow.layout = [StorefrontLayout, AccountLayout]
