import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, Lock, Send } from 'lucide-react'
import { toast } from 'sonner'
import Page from '~/components/page'
import { FormButton, FormSelectWithSearch, FormSwitch, FormTextarea } from '~/components/form'
import { Badge, Skeleton } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import AdminLayout from '~/layouts/admin'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { card, cn, inlineLink } from '~/lib/styles'
import { useCan } from '~/pages/admin/_hooks'
import { supportStatusMeta } from './_format'
import {
  useAdminSupportAssignees,
  useAdminSupportThread,
  useReplyAdminSupportTicket,
  useUpdateAdminSupportTicket,
} from './_hooks'
import {
  AdminSupportReplyFormSchema,
  SUPPORT_TICKET_STATUSES,
  SupportTicketStatusSchema,
  type AdminSupportMessage,
  type AdminSupportThread,
} from './_types'

const UNASSIGNED = ''

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="min-w-0 text-[13.5px] break-words text-ink">{children}</dd>
    </div>
  )
}

function MessageBubble({ message }: { message: AdminSupportMessage }) {
  const { formatDateTime } = useDateFormat()
  const fromStaff = message.authorType === 'staff'
  return (
    <li className={cn('flex min-w-0 flex-col gap-1', fromStaff ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[min(100%,560px)] min-w-0 rounded-2xl border px-4 py-3 text-[13.5px] leading-[1.55] break-words whitespace-pre-wrap',
          message.isInternal
            ? 'border-warning/40 bg-warning/10 text-ink'
            : fromStaff
              ? 'border-accent/20 bg-accent-soft text-ink'
              : 'border-line bg-paper text-ink'
        )}
      >
        {message.isInternal && (
          <span className="mb-1 flex items-center gap-1 text-[11.5px] font-semibold text-warning">
            <Lock size={11} /> Internal note
          </span>
        )}
        {message.body}
      </div>
      <span className="px-1 text-[11.5px] text-muted">
        {message.authorName} · {formatDateTime(message.createdAt)}
      </span>
    </li>
  )
}

function ReplyForm({ thread }: { thread: AdminSupportThread }) {
  const reply = useReplyAdminSupportTicket(thread.ticket.id)
  const [body, setBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = AdminSupportReplyFormSchema.safeParse({ body, isInternal })
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error))
      return
    }
    setErrors({})
    reply.mutate(parsed.data, {
      onSuccess: () => {
        setBody('')
        toast.success(isInternal ? 'Note added' : `Reply emailed to ${thread.ticket.email}`)
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 border-t border-line pt-5">
      <FormTextarea
        name="support-reply"
        label={isInternal ? 'Internal note (only staff can see this)' : 'Reply to customer'}
        rows={5}
        maxLength={5000}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        error={errors.body}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FormSwitch
          name="support-internal"
          label="Internal note"
          checked={isInternal}
          onChange={(event) => setIsInternal(event.target.checked)}
        />
        <FormButton
          type="submit"
          loading={reply.isPending}
          loadingText="Sending…"
          className="w-full sm:w-auto"
        >
          {isInternal ? <Lock size={15} /> : <Send size={15} />}
          {isInternal ? 'Add note' : 'Send reply'}
        </FormButton>
      </div>
    </form>
  )
}

function TicketSettings({ thread, canEdit }: { thread: AdminSupportThread; canEdit: boolean }) {
  const update = useUpdateAdminSupportTicket(thread.ticket.id)
  const assignees = useAdminSupportAssignees(canEdit)
  const options = [
    { value: UNASSIGNED, label: 'Unassigned' },
    ...(assignees.data ?? []).map((user) => ({ value: user.id, label: user.name })),
  ]
  const current = thread.ticket.assignedUser
  if (current && !options.some((option) => option.value === current.id)) {
    options.push({ value: current.id, label: current.name })
  }

  const onError = (error: unknown) => handleMutationError(error, () => undefined)

  return (
    <div className="flex flex-col gap-3">
      <FormSelectWithSearch
        name="support-status"
        label="Status"
        disabled={!canEdit || update.isPending}
        value={thread.ticket.status}
        onChange={(next) =>
          update.mutate(
            { status: SupportTicketStatusSchema.parse(next) },
            { onSuccess: () => toast.success('Status updated'), onError }
          )
        }
        options={SUPPORT_TICKET_STATUSES.map((value) => ({
          value,
          label: supportStatusMeta[value].label,
        }))}
      />
      <FormSelectWithSearch
        name="support-assignee"
        label="Assigned to"
        disabled={!canEdit || update.isPending}
        isLoading={assignees.isLoading}
        value={current?.id ?? UNASSIGNED}
        onChange={(next) =>
          update.mutate(
            { assignedUserId: next === UNASSIGNED ? null : next },
            { onSuccess: () => toast.success('Assignee updated'), onError }
          )
        }
        options={options}
      />
    </div>
  )
}

export default function AdminSupportTicketsShow({ id }: { id: string }) {
  const { formatDateTime } = useDateFormat()
  const { data: thread, isLoading, isError } = useAdminSupportThread(id)
  const canEdit = useCan('support_tickets.edit')

  const eyebrow = (
    <Link
      route="admin.support.tickets.home"
      className="inline-flex items-center gap-1 hover:text-ink"
    >
      <ArrowLeft size={12} /> Inbox
    </Link>
  )

  if (isLoading) {
    return (
      <Page eyebrow={eyebrow} title="Support request">
        <Skeleton className="h-64 w-full" />
      </Page>
    )
  }
  if (isError || !thread) {
    return (
      <Page eyebrow={eyebrow} title="Support request">
        <p className="text-[14px] text-danger">Could not load this request.</p>
      </Page>
    )
  }

  const { ticket } = thread
  const status = supportStatusMeta[ticket.status]

  return (
    <Page
      eyebrow={eyebrow}
      title={ticket.fullName}
      description={`${ticket.reference} · opened ${formatDateTime(ticket.createdAt)}`}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <section className={card.base}>
          <div className={card.head}>
            <div>
              <span className={card.eyebrow}>Conversation</span>
              <h2 className={card.title}>Messages</h2>
            </div>
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
          </div>
          <ol className="mb-5 flex flex-col gap-4" aria-label="Messages">
            {thread.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ol>
          {canEdit && <ReplyForm thread={thread} />}
        </section>

        <div className="flex min-w-0 flex-col gap-5">
          <section className={card.base}>
            <div className={card.head}>
              <div>
                <span className={card.eyebrow}>Contact</span>
                <h2 className={card.title}>Customer</h2>
              </div>
            </div>
            <dl className="divide-y divide-line">
              <MetaRow label="Name">{ticket.fullName}</MetaRow>
              <MetaRow label="Email">
                <a href={`mailto:${ticket.email}`} className={inlineLink}>
                  {ticket.email}
                </a>
              </MetaRow>
              <MetaRow label="Mobile">
                <a href={`tel:${ticket.mobile.replace(/[^\d+]/g, '')}`} className={inlineLink}>
                  {ticket.mobile}
                </a>
              </MetaRow>
              <MetaRow label="Account">
                {ticket.customer ? (
                  <Link
                    route="admin.customers.edit"
                    routeParams={{ id: ticket.customer.id }}
                    className={inlineLink}
                  >
                    {ticket.customer.name}
                  </Link>
                ) : (
                  'Guest'
                )}
              </MetaRow>
            </dl>
          </section>

          <section className={card.base}>
            <div className={card.head}>
              <div>
                <span className={card.eyebrow}>Handling</span>
                <h2 className={card.title}>Status and owner</h2>
              </div>
            </div>
            <TicketSettings thread={thread} canEdit={canEdit} />
          </section>

          {ticket.chatTranscript.length > 0 && (
            <section className={card.base}>
              <div className={card.head}>
                <div>
                  <span className={card.eyebrow}>Help chat</span>
                  <h2 className={card.title}>What they asked first</h2>
                </div>
              </div>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13px] text-ink-2">
                {ticket.chatTranscript.map((question, index) => (
                  <li key={index} className="break-words">
                    {question}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </Page>
  )
}

AdminSupportTicketsShow.layout = [AdminLayout]
