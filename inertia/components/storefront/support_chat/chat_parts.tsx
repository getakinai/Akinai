import { ArrowUpRight, CircleCheck, Pencil } from 'lucide-react'
import { Link } from '@adonisjs/inertia/react'
import { FormButton } from '~/components/form'
import { useDateFormat } from '~/hooks/use_date_format'
import { cn } from '~/lib/styles'
import type { SupportChatLink } from '~/pages/support/_types'
import { AGENT_NAME } from './phrases'
import type { ChatDraft } from './use_support_chat'
import type { ChatEntry, Chip, HandoffStep } from './_types'

const bubbleBase =
  'max-w-[85%] min-w-0 rounded-2xl px-3.5 py-2.5 text-[14px] leading-[1.5] break-words whitespace-pre-wrap'

/** Only same-site paths from the server become links. */
function isInternalHref(href: string) {
  return href.startsWith('/') && !href.startsWith('//')
}

function LinkCards({ links }: { links: SupportChatLink[] }) {
  return (
    <ul className="flex w-full max-w-[85%] flex-col gap-2">
      {links
        .filter((link) => isInternalHref(link.href))
        .map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-start gap-2 rounded-xl border border-sf-line bg-sf-surface px-3 py-2.5 transition-colors duration-150 hover:bg-sf-accent-soft focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-sf-text">{link.title}</span>
                {link.description && (
                  <span className="mt-0.5 line-clamp-2 block text-[12.5px] text-sf-muted">
                    {link.description}
                  </span>
                )}
              </span>
              <ArrowUpRight size={15} className="mt-0.5 flex-none text-sf-muted" />
            </Link>
          </li>
        ))}
    </ul>
  )
}

function SentCard({ entry }: { entry: Extract<ChatEntry, { kind: 'sent' }> }) {
  return (
    <div className="flex w-full max-w-[85%] flex-col gap-1 rounded-xl border border-sf-line bg-sf-surface px-3.5 py-3">
      <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-sf-text">
        <CircleCheck size={16} className="text-ok" /> Message sent
      </span>
      <span className="font-mono text-[13px] text-sf-muted">{entry.reference}</span>
      {entry.accountTicketId && (
        <Link
          route="customers.account.support.show"
          routeParams={{ id: entry.accountTicketId }}
          className="text-[13px] font-medium text-sf-text underline decoration-sf-accent decoration-2 underline-offset-2 hover:decoration-sf-text"
        >
          View in My account
        </Link>
      )}
    </div>
  )
}

export function ChatEntryView({ entry }: { entry: ChatEntry }) {
  const { formatTime } = useDateFormat()

  if (entry.kind === 'links') {
    return (
      <li className="flex justify-start">
        <LinkCards links={entry.links} />
      </li>
    )
  }
  if (entry.kind === 'sent') {
    return (
      <li className="flex justify-start">
        <SentCard entry={entry} />
      </li>
    )
  }

  const fromUser = entry.role === 'user'
  return (
    <li className={cn('flex flex-col gap-0.5', fromUser ? 'items-end' : 'items-start')}>
      <span className="sr-only">{fromUser ? 'You said:' : `${AGENT_NAME}:`}</span>
      <div
        className={cn(
          bubbleBase,
          fromUser
            ? 'rounded-br-md bg-sf-accent text-sf-text'
            : 'rounded-bl-md bg-sf-surface-2 text-sf-text'
        )}
      >
        {entry.text}
      </div>
      <time dateTime={entry.at} className="px-1 text-[11px] text-sf-muted">
        {formatTime(entry.at)}
      </time>
    </li>
  )
}

export function TypingIndicator() {
  return (
    <li className="flex justify-start" aria-label={`${AGENT_NAME} is typing`}>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-sf-surface-2 px-3.5 py-3">
        {['', '[animation-delay:150ms]', '[animation-delay:300ms]'].map((delay) => (
          <span
            key={delay}
            className={cn(
              'size-1.5 animate-bounce rounded-full bg-sf-muted motion-reduce:animate-none',
              delay
            )}
          />
        ))}
      </div>
    </li>
  )
}

export function QuickReplies({
  chips,
  disabled,
  onPick,
}: {
  chips: Chip[]
  disabled: boolean
  onPick: (chip: Chip) => void
}) {
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Quick replies">
      {chips.map((chip) => (
        <button
          key={`${chip.action.type}-${chip.label}`}
          type="button"
          disabled={disabled}
          onClick={() => onPick(chip)}
          className="inline-flex min-h-9 max-w-full items-center rounded-full border border-sf-accent bg-sf-surface px-3 py-1.5 text-left text-[13px] font-medium text-sf-text transition-colors duration-150 hover:bg-sf-accent-soft focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-55"
        >
          <span className="line-clamp-2">{chip.label}</span>
        </button>
      ))}
    </div>
  )
}

const summaryLabels: Record<HandoffStep, string> = {
  fullName: 'Name',
  mobile: 'Mobile',
  email: 'Email',
  concern: 'Message',
}

export function HandoffSummary({
  draft,
  steps,
  accountEmail,
  sending,
  disabled,
  onEdit,
  onSend,
  onCancel,
}: {
  draft: ChatDraft
  /** The answers the customer gave; details from their account are not listed. */
  steps: HandoffStep[]
  accountEmail: string | null
  sending: boolean
  disabled: boolean
  onEdit: (step: HandoffStep) => void
  onSend: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-sf-line bg-sf-surface p-3.5">
      <dl className="flex flex-col gap-2.5">
        {steps.map((step) => (
          <div key={step} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <dt className="text-[11.5px] text-sf-muted">{summaryLabels[step]}</dt>
              <dd
                className={cn(
                  'text-[13.5px] break-words text-sf-text',
                  step === 'concern' && 'line-clamp-4 whitespace-pre-wrap'
                )}
              >
                {draft[step]}
              </dd>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onEdit(step)}
              className="inline-grid size-9 flex-none place-items-center rounded-lg text-sf-muted transition-colors duration-150 hover:bg-sf-accent-soft hover:text-sf-text focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-55"
              aria-label={`Edit ${summaryLabels[step].toLowerCase()}`}
            >
              <Pencil size={14} />
            </button>
          </div>
        ))}
      </dl>
      {accountEmail && (
        <p className="text-[12px] break-words text-sf-muted">
          We’ll reply to {accountEmail}, the email on your account.
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <FormButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={onCancel}
        >
          Cancel
        </FormButton>
        <FormButton
          type="button"
          size="sm"
          loading={sending}
          loadingText="Sending…"
          disabled={disabled && !sending}
          onClick={onSend}
        >
          Send to the team
        </FormButton>
      </div>
    </div>
  )
}
