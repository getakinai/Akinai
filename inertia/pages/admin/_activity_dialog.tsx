import { FormButton } from '~/components/form'
import { Badge, Dialog } from '~/components/ui'
import {
  auditActionMeta,
  auditFieldChanges,
  auditRecordName,
  auditTitle,
  formatAuditDate,
  isEventAction,
  isSecurityAction,
  securitySummary,
} from './_audit_format'
import { type AuditLog } from './_audit_types'

const valueBox =
  'min-w-0 rounded-md border border-line bg-paper px-3 py-2 text-[13.5px] break-words whitespace-pre-wrap text-ink'

function summary(log: AuditLog, changeCount: number) {
  if (isSecurityAction(log.action)) return `${securitySummary(log.action)}.`
  if (log.action === 'deleted') return 'This record was removed. Its details at the time are below.'
  if (isEventAction(log.action)) return 'Details recorded at the time are below.'
  return `${changeCount} ${changeCount === 1 ? 'field' : 'fields'} changed.`
}

export default function ActivityDialog({
  log,
  onClose,
}: {
  log: AuditLog | null
  onClose: () => void
}) {
  const action = log ? auditActionMeta[log.action] : null
  const changes = log ? auditFieldChanges(log) : []
  const showsDiff = log?.action === 'updated' || log?.action === 'paid'

  return (
    <Dialog
      open={log !== null}
      onClose={onClose}
      className="max-w-[640px]!"
      title={log ? auditTitle(log) : ''}
      description={
        log &&
        action && (
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={action.tone} dot>
              {action.label}
            </Badge>
            <strong className="font-medium text-ink">{auditRecordName(log)}</strong>
            <span>· {formatAuditDate(log.createdAt)}</span>
          </span>
        )
      }
    >
      {log && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-muted">{summary(log, changes.length)}</p>

          <dl className="flex flex-col gap-4">
            {changes.map((change) => (
              <div key={change.key} className="flex flex-col gap-1.5">
                <dt className="text-[13px] font-medium text-ink">{change.label}</dt>
                {showsDiff ? (
                  <dd className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-[11.5px] tracking-[0.04em] text-subtle uppercase">
                        Before
                      </span>
                      <span className={`${valueBox} text-muted line-through`}>{change.before}</span>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-[11.5px] tracking-[0.04em] text-subtle uppercase">
                        After
                      </span>
                      <span className={valueBox}>{change.after}</span>
                    </div>
                  </dd>
                ) : (
                  <dd className={valueBox}>{change.after ?? change.before}</dd>
                )}
              </div>
            ))}
          </dl>

          {log.ipAddress && (
            <p className="text-[12.5px] text-subtle">Made from IP address {log.ipAddress}</p>
          )}

          <div className="flex justify-end">
            <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
              Close
            </FormButton>
          </div>
        </div>
      )}
    </Dialog>
  )
}
