import { Link } from '@adonisjs/inertia/react'
import { Badge } from '~/components/ui'
import { card, dataTable } from '~/lib/styles'
import { useCan } from '../_hooks'
import { useDateFormat } from '~/hooks/use_date_format'
import { emailStatusMeta, emailTypeLabels, recipientsSummary } from './_format'
import { useAdminRecentEmails } from './_hooks'

type EmailsCardProps = { orderId: string } | { customerId: string }

/**
 * The latest emails sent about an order or to a customer. Hidden for staff
 * without `emails.view`.
 */
export default function EmailsCard(scope: EmailsCardProps) {
  const { formatDateTime } = useDateFormat()
  const canView = useCan('emails.view')
  const { data, isLoading, isError } = useAdminRecentEmails(scope, canView)

  if (!canView) return null

  const emails = data?.data ?? []
  const total = data?.metadata.total ?? 0

  return (
    <section className={card.base}>
      <div className={card.head}>
        <div>
          <span className={card.eyebrow}>Notifications</span>
          <h2 className={card.title}>Emails</h2>
        </div>
        {total > emails.length && (
          <Link route="admin.emails.home" className={card.action}>
            View all emails
          </Link>
        )}
      </div>

      {isLoading && <p className="text-[13.5px] text-muted">Loading emails…</p>}
      {isError && <p className="text-[13.5px] text-danger">Could not load emails.</p>}
      {!isLoading && !isError && emails.length === 0 && (
        <p className="text-[13.5px] text-muted">No emails sent yet.</p>
      )}

      {emails.length > 0 && (
        <ul className="divide-y divide-line">
          {emails.map((email) => {
            const status = emailStatusMeta[email.status]
            return (
              <li
                key={email.id}
                className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    route="admin.emails.show"
                    routeParams={{ id: email.id }}
                    className="line-clamp-1 text-[13.5px] font-medium text-ink hover:underline"
                  >
                    {emailTypeLabels[email.type]}
                  </Link>
                  <div className="mt-0.5 truncate text-[12px] text-muted">
                    {recipientsSummary(email.toAddresses)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={dataTable.mono}>{formatDateTime(email.createdAt)}</span>
                  <Badge tone={status.tone} dot>
                    {status.label}
                  </Badge>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
