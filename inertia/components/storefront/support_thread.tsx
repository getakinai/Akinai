import { useState, type FormEvent, type ReactNode } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { FormButton, FormTextarea } from '~/components/form'
import { Badge } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import type { FieldErrors } from '~/lib/http'
import { cn, storefront, type BadgeTone } from '~/lib/styles'
import {
  MAX_SUPPORT_MESSAGE_LENGTH,
  SupportReplyFormSchema,
  type SupportMessage,
  type SupportReplyForm,
  type SupportTicketStatus,
} from '~/pages/support/_types'

export const customerSupportStatusMeta: Record<
  SupportTicketStatus,
  { label: string; tone: BadgeTone }
> = {
  open: { label: 'Waiting on us', tone: 'warning' },
  pending_customer: { label: 'We replied', tone: 'info' },
  closed: { label: 'Resolved', tone: 'neutral' },
}

export function SupportStatusBadge({ status }: { status: SupportTicketStatus }) {
  const meta = customerSupportStatusMeta[status]
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

/** The conversation, oldest first: the customer's messages on the right. */
export function SupportMessages({ messages }: { messages: SupportMessage[] }) {
  const { formatDateTime } = useDateFormat()
  return (
    <ol className="flex flex-col gap-4" aria-label="Messages">
      {messages.map((message) => (
        <li
          key={message.id}
          className={cn(
            'flex min-w-0 flex-col gap-1',
            message.fromCustomer ? 'items-end' : 'items-start'
          )}
        >
          <div
            className={cn(
              'max-w-[min(100%,560px)] min-w-0 rounded-2xl px-4 py-3 text-[14px] leading-[1.55] break-words whitespace-pre-wrap',
              message.fromCustomer
                ? 'rounded-br-md bg-sf-primary text-sf-primary-fg'
                : 'rounded-bl-md border border-sf-line bg-sf-surface-2 text-sf-text'
            )}
          >
            {message.body}
          </div>
          <span className="px-1 text-[12px] text-sf-muted">
            {message.fromCustomer ? 'You' : (message.staffName ?? 'Our team')} ·{' '}
            {formatDateTime(message.createdAt)}
          </span>
        </li>
      ))}
    </ol>
  )
}

type SupportReplyBoxProps = {
  isPending: boolean
  onSend: (
    payload: SupportReplyForm,
    callbacks: { onSuccess: () => void; onError: (error: unknown) => void }
  ) => void
  closed: boolean
  footer?: ReactNode
}

/** Reply box under a support conversation. Replying to a resolved request reopens it. */
export function SupportReplyBox({ isPending, onSend, closed, footer }: SupportReplyBoxProps) {
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = SupportReplyFormSchema.safeParse({ body })
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error))
      return
    }
    setErrors({})
    onSend(parsed.data, {
      onSuccess: () => {
        setBody('')
        toast.success('Message sent. We’ll email you when we reply.')
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className={cn(storefront.card, 'flex flex-col gap-3 p-4 sm:p-5')}
    >
      <FormTextarea
        name="support-reply"
        label={closed ? 'Need more help? Reply to reopen this request' : 'Your reply'}
        rows={4}
        maxLength={MAX_SUPPORT_MESSAGE_LENGTH}
        value={body}
        disabled={isPending}
        error={errors.body}
        onChange={(event) => setBody(event.target.value)}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-sf-muted">{footer}</div>
        <FormButton
          className="w-full sm:w-fit"
          loading={isPending}
          loadingText="Sending…"
          disabled={body.trim() === ''}
        >
          <Send size={15} /> Send
        </FormButton>
      </div>
    </form>
  )
}
