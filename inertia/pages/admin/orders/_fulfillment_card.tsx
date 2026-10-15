import { useState } from 'react'
import { ExternalLink, PackageCheck, Pencil, Truck, X } from 'lucide-react'
import { toast } from 'sonner'
import { FormButton, FormSelect } from '~/components/form'
import { Badge, Dialog } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import { card } from '~/lib/styles'
import { formatMoney, fulfillmentStatusMeta, variantLabel, variantTitle } from './_format'
import FulfillDialog from './_fulfill_dialog'
import { useCancelFulfillment, useSetOrderFulfillmentStatus } from './_hooks'
import TrackingDialog from './_tracking_dialog'
import {
  type AdminFulfillment,
  type AdminOrderDetail,
  type ManualFulfillmentStatus,
} from './_types'

type FulfillmentCardProps = {
  order: AdminOrderDetail
  canFulfill: boolean
}

const manualStatusOptions = (['unfulfilled', 'in_progress', 'on_hold'] as const).map((status) => ({
  value: status,
  label: fulfillmentStatusMeta[status].label,
}))

/**
 * The order's products split into what is left to fulfill and one section
 * per fulfillment, with the fulfill, tracking and cancel actions.
 */
export default function FulfillmentCard({ order, canFulfill }: FulfillmentCardProps) {
  const [fulfilling, setFulfilling] = useState(false)
  const [fulfillKey, setFulfillKey] = useState(0)
  const [editingTracking, setEditingTracking] = useState<AdminFulfillment | null>(null)
  const [cancelling, setCancelling] = useState<AdminFulfillment | null>(null)
  const setStatus = useSetOrderFulfillmentStatus()
  const cancelFulfillment = useCancelFulfillment()

  const money = (amount: number) => formatMoney(amount, order.currencyCode)
  const left = (line: AdminOrderDetail['lineItems'][number]) =>
    Math.max(line.quantity - line.fulfilledQuantity - line.removedQuantity, 0)
  const unfulfilled = order.lineItems.filter((line) => left(line) > 0)
  const hasFulfilled = order.lineItems.some((line) => line.fulfilledQuantity > 0)
  const isOnHold = order.fulfillmentStatus === 'on_hold'
  const status = fulfillmentStatusMeta[order.fulfillmentStatus]

  const changeStatus = (next: ManualFulfillmentStatus) => {
    setStatus.mutate(
      { id: order.id, status: next },
      {
        onSuccess: () => toast.success(`Marked as ${fulfillmentStatusMeta[next].label}`),
        onError: (error) => toast.error(error.message),
      }
    )
  }

  const cancel = (fulfillment: AdminFulfillment) => {
    cancelFulfillment.mutate(fulfillment.id, {
      onSuccess: () => {
        toast.success(`Fulfillment #${fulfillment.number} cancelled`)
        setCancelling(null)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <>
      <section className={card.base}>
        <header className={card.head}>
          <div>
            <span className={card.eyebrow}>Order</span>
            <h2 className={card.title}>Products</h2>
          </div>
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
        </header>

        {unfulfilled.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-ink">Unfulfilled</h3>
              {canFulfill && (
                <div className="flex flex-wrap items-center gap-2">
                  {!hasFulfilled && (
                    <div className="w-[170px] max-w-full">
                      <FormSelect
                        name="fulfillmentStatus"
                        label="Fulfillment status"
                        hideLabel
                        compact
                        options={manualStatusOptions}
                        value={order.fulfillmentStatus}
                        disabled={setStatus.isPending}
                        onChange={(event) =>
                          changeStatus(event.target.value as ManualFulfillmentStatus)
                        }
                      />
                    </div>
                  )}
                  <FormButton
                    type="button"
                    size="sm"
                    disabled={isOnHold}
                    title={isOnHold ? 'Release the hold before fulfilling' : undefined}
                    onClick={() => {
                      setFulfillKey((key) => key + 1)
                      setFulfilling(true)
                    }}
                  >
                    <PackageCheck size={14} /> Fulfill items
                  </FormButton>
                </div>
              )}
            </div>
            {isOnHold && (
              <p className="text-[12.5px] text-muted">
                This order is on hold. Set it back to Unfulfilled or In progress to fulfill it.
              </p>
            )}
            <ul className="flex flex-col divide-y divide-line">
              {unfulfilled.map((line) => {
                const remaining = left(line)
                return (
                  <li
                    key={line.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-ink">
                        {line.productTitle}
                      </p>
                      <p className="truncate text-[12.5px] text-muted">
                        {[variantTitle(line.variantTitle), line.sku].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="text-right text-[14px]">
                      <p className="text-ink">{money(line.lineTotal)}</p>
                      <p className="text-[12.5px] text-muted">
                        {money(line.unitPrice)} × {line.quantity}
                        {remaining < line.quantity && ` · ${remaining} left`}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {order.fulfillments.map((fulfillment) => (
          <FulfillmentSection
            key={fulfillment.id}
            fulfillment={fulfillment}
            canFulfill={canFulfill}
            onEditTracking={() => setEditingTracking(fulfillment)}
            onCancel={() => setCancelling(fulfillment)}
          />
        ))}
      </section>

      {canFulfill && (
        <FulfillDialog
          key={fulfillKey}
          order={order}
          open={fulfilling}
          onClose={() => setFulfilling(false)}
        />
      )}
      {editingTracking && (
        <TrackingDialog
          key={editingTracking.id}
          fulfillment={editingTracking}
          canNotify={Boolean(order.email)}
          open
          onClose={() => setEditingTracking(null)}
        />
      )}
      <Dialog
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title={cancelling ? `Cancel fulfillment #${cancelling.number}?` : ''}
        description="Its items go back to unfulfilled and their stock back to committed at the location."
        className="w-[min(440px,calc(100vw-24px))]"
      >
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" onClick={() => setCancelling(null)}>
            Keep fulfillment
          </FormButton>
          <FormButton
            type="button"
            variant="danger"
            loading={cancelFulfillment.isPending}
            loadingText="Cancelling…"
            onClick={() => cancelling && cancel(cancelling)}
          >
            Cancel fulfillment
          </FormButton>
        </div>
      </Dialog>
    </>
  )
}

type FulfillmentSectionProps = {
  fulfillment: AdminFulfillment
  canFulfill: boolean
  onEditTracking: () => void
  onCancel: () => void
}

function FulfillmentSection({
  fulfillment,
  canFulfill,
  onEditTracking,
  onCancel,
}: FulfillmentSectionProps) {
  const { formatOrderDate } = useDateFormat()
  const cancelled = fulfillment.status === 'cancelled'
  const carrier = [fulfillment.trackingCompany, fulfillment.trackingNumber]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink">
            Fulfillment #{fulfillment.number}
            <Badge tone={cancelled ? 'neutral' : 'success'}>
              {cancelled ? 'Cancelled' : 'Fulfilled'}
            </Badge>
          </h3>
          <p className="text-[12.5px] text-muted">
            {formatOrderDate(cancelled ? fulfillment.cancelledAt : fulfillment.createdAt)}
          </p>
        </div>
        {canFulfill && !cancelled && (
          <div className="flex flex-wrap gap-2">
            <FormButton type="button" variant="secondary" size="sm" onClick={onEditTracking}>
              <Pencil size={13} /> Tracking
            </FormButton>
            <FormButton type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X size={13} /> Cancel
            </FormButton>
          </div>
        )}
      </div>

      {carrier && (
        <p className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink-2">
          <Truck size={14} className="shrink-0" aria-hidden="true" />
          {fulfillment.trackingUrl ? (
            <a
              href={fulfillment.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-1 truncate text-accent hover:underline"
            >
              <span className="truncate">{carrier}</span>
              <ExternalLink size={12} className="shrink-0" aria-hidden="true" />
            </a>
          ) : (
            <span className="truncate">{carrier}</span>
          )}
        </p>
      )}

      <ul className={`flex flex-col gap-1.5 ${cancelled ? 'opacity-60' : ''}`}>
        {fulfillment.lines.map((line) => (
          <li key={line.lineItemId} className="flex justify-between gap-3 text-[13.5px]">
            <span className="min-w-0 truncate text-ink">{variantLabel(line)}</span>
            <span className="shrink-0 text-muted">× {line.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
