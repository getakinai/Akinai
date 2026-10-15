import { Link } from '@adonisjs/inertia/react'
import { RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { FormButton } from '~/components/form'
import { Badge, Dialog, Skeleton } from '~/components/ui'
import { handleMutationError } from '~/lib/form'
import { useCan } from '../_hooks'
import { actorName } from '../_notification_hooks'
import { useDateFormat } from '~/hooks/use_date_format'
import { eventChangeRows, eventStatusMeta, eventTypeLabels } from './_format'
import { useAdminEvent, useRetryAdminEvent } from './_hooks'

type EventDialogProps = {
  id: string
  onClose: () => void
}

/** What happened, who did it, what changed and whether the push went out. */
export default function EventDialog({ id, onClose }: EventDialogProps) {
  const { formatDateTime } = useDateFormat()
  const { data: event, isLoading, isError } = useAdminEvent(id)
  const canRetry = useCan('events.edit')
  const retry = useRetryAdminEvent()

  function resend() {
    retry.mutate(id, {
      onSuccess: (updated) =>
        updated.status === 'delivered'
          ? toast.success('Notification re-sent')
          : toast.error(updated.lastError ?? 'Could not re-send the notification'),
      onError: (error) => handleMutationError(error, () => undefined),
    })
  }

  const rows = event ? eventChangeRows(event.details) : []
  const status = event ? eventStatusMeta[event.status] : null

  return (
    <Dialog
      open
      onClose={onClose}
      title={event ? eventTypeLabels[event.type] : 'Event'}
      className="w-[min(560px,calc(100vw-24px))]"
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : isError || !event || !status ? (
        <p className="text-[13.5px] text-danger">This event could not be loaded.</p>
      ) : (
        <>
          <p className="text-[14px] text-ink">
            <span className="font-semibold">{actorName(event)}</span> {event.title}
          </p>

          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-[auto_1fr]">
            <dt className="text-muted">When</dt>
            <dd className="text-ink">{formatDateTime(event.createdAt)}</dd>
            <dt className="text-muted">Actor</dt>
            <dd className="text-ink capitalize">
              {event.actorType}
              {event.actorLabel && <span className="normal-case"> · {event.actorLabel}</span>}
            </dd>
            {event.orderId && (
              <>
                <dt className="text-muted">Order</dt>
                <dd>
                  <Link
                    route="admin.orders.show"
                    routeParams={{ id: event.orderId }}
                    className="text-accent hover:underline"
                  >
                    {event.subjectType === 'Order'
                      ? (event.subjectLabel ?? 'View order')
                      : 'View order'}
                  </Link>
                </dd>
              </>
            )}
            <dt className="text-muted">Delivery</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <Badge tone={status.tone} dot>
                {status.label}
              </Badge>
              <span className="text-muted">
                {event.attempts} {event.attempts === 1 ? 'attempt' : 'attempts'}
                {event.deliveredAt && ` · ${formatDateTime(event.deliveredAt)}`}
              </span>
            </dd>
          </dl>

          {event.lastError && event.status !== 'delivered' && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] break-words text-danger">
              {event.lastError}
            </p>
          )}

          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-paper text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Field</th>
                    <th className="px-3 py-2 font-medium">Before</th>
                    <th className="px-3 py-2 font-medium">After</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-t border-line">
                      <td className="px-3 py-2 text-muted">{row.label}</td>
                      <td className="px-3 py-2 break-words text-ink">{row.before}</td>
                      <td className="px-3 py-2 break-words text-ink">{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" onClick={onClose}>
          Close
        </FormButton>
        {canRetry && event && (
          <FormButton
            type="button"
            loading={retry.isPending}
            loadingText="Re-sending…"
            onClick={resend}
          >
            <RotateCw size={15} /> Re-send
          </FormButton>
        )}
      </div>
    </Dialog>
  )
}
