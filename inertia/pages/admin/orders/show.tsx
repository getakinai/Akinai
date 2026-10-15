import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Ban,
  FileText,
  Package,
  Pencil,
  Receipt,
  Undo2,
} from 'lucide-react'
import { toast } from 'sonner'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Skeleton } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import AdminLayout from '~/layouts/admin'
import { buttonClasses, card, field, inlineLink } from '~/lib/styles'
import { useCan, useIsAdmin } from '../_hooks'
import { customerDisplayName } from '../customers/_format'
import EmailsCard from '../emails/_emails_card'
import {
  cancelReasonLabels,
  formatMoney,
  orderAddressLines,
  orderLabel,
  orderState,
  paymentStatusMeta,
} from './_format'
import ActivityCard from './_activity_card'
import CancelDialog from './_cancel_dialog'
import EditOrderDialog from './_edit_order_dialog'
import FulfillmentCard from './_fulfillment_card'
import { useAdminOrder, useArchiveOrder, useUnarchiveOrder } from './_hooks'
import OrderStateBanner from './_order_state_banner'
import RefundDialog, { type RefundPreset } from './_refund_dialog'
import RefundsCard from './_refunds_card'
import NotesCard from './_notes_card'
import PaymentProofCard from './_payment_proof_card'
import ReturnsCard from './_returns_card'
import SummaryRow from './_summary_row'

export default function AdminOrdersShow({ id }: { id: string }) {
  const { formatOrderDate } = useDateFormat()
  const { data: order, isLoading, isError, refetch } = useAdminOrder(id)
  const canViewCustomers = useCan('customers.view')
  const canEditOrders = useCan('orders.edit')
  const isAdmin = useIsAdmin()
  const [editing, setEditing] = useState(false)
  const [editKey, setEditKey] = useState(0)
  const canEdit = Boolean(order?.canEditPlaced && isAdmin && canEditOrders)
  const canArchive = useCan('orders.archive') && Boolean(order) && order?.status !== 'draft'
  const canRefundOrders = useCan('refunds.create')
  const [dialog, setDialog] = useState<'refund' | 'cancel' | null>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [refundPreset, setRefundPreset] = useState<RefundPreset | undefined>()
  const isPaid = order?.paymentStatus === 'paid' || order?.paymentStatus === 'partially_refunded'
  const canRefund = Boolean(
    canRefundOrders && order && isPaid && order.total - order.refundedTotal > 0
  )
  const canCancel = Boolean(canRefundOrders && order?.status === 'open')
  const hasDocuments = Boolean(order && order.status !== 'draft')
  const hasReceipt = isPaid || order?.paymentStatus === 'refunded'
  const openDialog = (next: 'refund' | 'cancel', preset?: RefundPreset) => {
    setDialogKey((key) => key + 1)
    setRefundPreset(preset)
    setDialog(next)
  }
  const archiveOrder = useArchiveOrder()
  const unarchiveOrder = useUnarchiveOrder()

  const toggleArchived = () => {
    if (!order) return
    const mutation = order.archivedAt ? unarchiveOrder : archiveOrder
    mutation.mutate(order.id, {
      onSuccess: (saved) =>
        toast.success(`Order ${orderLabel(saved)} ${saved.archivedAt ? 'archived' : 'unarchived'}`),
      onError: (error) => toast.error(error.message),
    })
  }
  const payment = order?.paymentStatus ? paymentStatusMeta[order.paymentStatus] : null
  const money = (amount: number) => formatMoney(amount, order?.currencyCode ?? '')

  return (
    <Page
      eyebrow={
        <Link route="admin.orders.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Orders
        </Link>
      }
      title={order ? `Order ${orderLabel(order)}` : 'Order'}
      description={
        order ? `Placed ${formatOrderDate(order.completedAt ?? order.createdAt)}` : undefined
      }
      actions={
        order &&
        (hasDocuments || canEdit || canArchive || canRefund || canCancel) && (
          <div className="flex flex-wrap gap-2">
            {hasDocuments && (
              <>
                <a
                  href={`/admin/orders/${order.id}/invoice`}
                  download
                  className={buttonClasses({ variant: 'secondary' })}
                >
                  <FileText size={14} /> Invoice
                </a>
                {hasReceipt && (
                  <a
                    href={`/admin/orders/${order.id}/receipt`}
                    download
                    className={buttonClasses({ variant: 'secondary' })}
                  >
                    <Receipt size={14} /> Receipt
                  </a>
                )}
                <a
                  href={`/admin/orders/${order.id}/packing-slip`}
                  download
                  className={buttonClasses({ variant: 'secondary' })}
                >
                  <Package size={14} /> Packing slip
                </a>
              </>
            )}
            {canRefund && (
              <FormButton type="button" variant="secondary" onClick={() => openDialog('refund')}>
                <Undo2 size={14} /> Refund
              </FormButton>
            )}
            {canCancel && (
              <FormButton type="button" variant="secondary" onClick={() => openDialog('cancel')}>
                <Ban size={14} /> Cancel order
              </FormButton>
            )}
            {canArchive && (
              <FormButton
                type="button"
                variant="secondary"
                loading={archiveOrder.isPending || unarchiveOrder.isPending}
                loadingText={order.archivedAt ? 'Unarchiving…' : 'Archiving…'}
                onClick={toggleArchived}
              >
                {order.archivedAt ? (
                  <>
                    <ArchiveRestore size={14} /> Unarchive
                  </>
                ) : (
                  <>
                    <Archive size={14} /> Archive
                  </>
                )}
              </FormButton>
            )}
            {canEdit && (
              <FormButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditKey((key) => key + 1)
                  setEditing(true)
                }}
              >
                <Pencil size={14} /> Edit order
              </FormButton>
            )}
          </div>
        )
      }
    >
      {isLoading ? (
        <div className={`${card.base} flex flex-col gap-3`} aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !order ? (
        <div
          className={`${card.base} flex flex-col items-center gap-3 py-12 text-center text-[14px] text-muted`}
        >
          Could not load this order.
          <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
            Try again
          </FormButton>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <OrderStateBanner state={orderState(order)} bankReference={order.bankReference} />
          {order.cancelledAt && (
            <p
              role="status"
              className="flex flex-wrap items-center gap-2 rounded-card border border-line-2 bg-card px-4 py-3 text-[13.5px] text-ink-2"
            >
              <Ban size={15} aria-hidden="true" />
              Cancelled {formatOrderDate(order.cancelledAt)}
              {order.cancelReason &&
                ` · ${cancelReasonLabels[order.cancelReason] ?? order.cancelReason}`}
            </p>
          )}
          {order.archivedAt && (
            <p
              role="status"
              className="flex flex-wrap items-center gap-2 rounded-card border border-line-2 bg-card px-4 py-3 text-[13.5px] text-ink-2"
            >
              <Archive size={15} aria-hidden="true" />
              Archived {formatOrderDate(order.archivedAt)}. It is hidden from the active orders
              list.
            </p>
          )}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
            <div className="flex min-w-0 flex-col gap-6">
              <PaymentProofCard order={order} canReview={canEditOrders} />

              <FulfillmentCard
                order={order}
                canFulfill={canEditOrders && order.status === 'open'}
              />

              <section className={card.base}>
                <header className={card.head}>
                  <div>
                    <span className={card.eyebrow}>Payment</span>
                    <h2 className={card.title}>{payment ? payment.label : 'Summary'}</h2>
                  </div>
                </header>
                <div className="divide-y divide-line">
                  <SummaryRow label="Subtotal" amount={money(order.subtotal)} />
                  {order.discountTitle && (
                    <SummaryRow
                      label="Discount"
                      detail={[order.discountCode, order.discountTitle].filter(Boolean).join(' · ')}
                      amount={`−${money(order.discountTotal)}`}
                    />
                  )}
                  {order.shippingTitle && (
                    <SummaryRow
                      label="Shipping"
                      detail={order.shippingTitle}
                      amount={money(order.shippingTotal + order.shippingDiscountTotal)}
                    />
                  )}
                  {order.shippingDiscountTitle && (
                    <SummaryRow
                      label="Free shipping"
                      detail={[order.shippingDiscountCode, order.shippingDiscountTitle]
                        .filter(Boolean)
                        .join(' · ')}
                      amount={`−${money(order.shippingDiscountTotal)}`}
                    />
                  )}
                  <SummaryRow
                    label={order.pricesIncludeTax ? 'Tax (included)' : 'Tax'}
                    detail={order.taxName ? `${order.taxName} ${order.taxRate}%` : 'No tax'}
                    amount={money(order.taxTotal)}
                  />
                  <SummaryRow
                    strong
                    label={order.isTotalOverridden ? 'Total (overridden)' : 'Total'}
                    detail={order.currencyCode}
                    amount={money(order.total)}
                  />
                  {order.isTotalOverridden && order.calculatedTotal !== null && (
                    <SummaryRow
                      label="Calculated total"
                      detail={order.totalOverrideReason}
                      amount={<span className="line-through">{money(order.calculatedTotal)}</span>}
                    />
                  )}
                  {order.refundedTotal > 0 && (
                    <>
                      <SummaryRow label="Refunded" amount={`−${money(order.refundedTotal)}`} />
                      <SummaryRow
                        strong
                        label="Net"
                        amount={money(order.total - order.refundedTotal)}
                      />
                    </>
                  )}
                  {order.bankReference && (
                    <SummaryRow
                      label="Bank reference"
                      detail="Bank transfer"
                      amount={<span className="font-mono">{order.bankReference}</span>}
                    />
                  )}
                </div>
              </section>

              <ReturnsCard
                order={order}
                canEdit={canEditOrders}
                canRefund={canRefund}
                onRefund={(preset) => openDialog('refund', preset)}
              />

              <RefundsCard order={order} />

              <NotesCard orderId={order.id} canAdd={canEditOrders} customerEmail={order.email} />

              <ActivityCard orderId={order.id} />
            </div>

            <aside className="flex min-w-0 flex-col gap-6">
              <section className={card.base}>
                <header className={card.head}>
                  <div>
                    <span className={card.eyebrow}>Customer</span>
                    <h2 className={card.title}>
                      {order.customer ? customerDisplayName(order.customer) : 'No customer'}
                    </h2>
                  </div>
                </header>
                <div className="flex flex-col gap-5 text-[13.5px]">
                  {order.email && (
                    <div className="flex flex-col gap-0.5">
                      <span className={field.label}>Contact information</span>
                      <span className="truncate text-ink-2">{order.email}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className={field.label}>Shipping address</span>
                    {order.shippingAddress ? (
                      orderAddressLines(order.shippingAddress).map((line) => (
                        <span key={line} className="text-ink-2">
                          {line}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">No shipping address</span>
                    )}
                  </div>
                  {order.customer && canViewCustomers && (
                    <Link
                      route="admin.customers.edit"
                      routeParams={{ id: order.customer.id }}
                      className={inlineLink}
                    >
                      View customer
                    </Link>
                  )}
                </div>
              </section>
              <EmailsCard orderId={order.id} />
            </aside>
          </div>
          {canRefund && dialog === 'refund' && (
            <RefundDialog
              key={`refund-${dialogKey}`}
              order={order}
              open
              preset={refundPreset}
              onClose={() => setDialog(null)}
            />
          )}
          {canCancel && dialog === 'cancel' && (
            <CancelDialog
              key={`cancel-${dialogKey}`}
              order={order}
              open
              onClose={() => setDialog(null)}
            />
          )}
          {canEdit && (
            <EditOrderDialog
              key={editKey}
              order={order}
              open={editing}
              onClose={() => setEditing(false)}
            />
          )}
        </div>
      )}
    </Page>
  )
}

AdminOrdersShow.layout = [AdminLayout]
