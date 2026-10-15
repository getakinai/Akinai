import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { Minus, MessageCircle, SendHorizontal, SquarePen } from 'lucide-react'
import { FormInput, FormTextarea } from '~/components/form'
import RecaptchaNotice from '~/components/recaptcha_notice'
import { cn, storefront } from '~/lib/styles'
import { customerKeys, fetchCustomerMe } from '~/pages/customers/_hooks'
import {
  MAX_SUPPORT_CHAT_QUESTION_LENGTH,
  MAX_SUPPORT_MESSAGE_LENGTH,
} from '~/pages/support/_types'
import { ChatEntryView, HandoffSummary, QuickReplies, TypingIndicator } from './chat_parts'
import { SUPPORT_CHAT_OPEN_EVENT } from './events'
import { AGENT_NAME } from './phrases'
import { useSupportChat, type ChatMode } from './use_support_chat'
import { type HandoffStep } from './_types'

const inputLabels: Record<HandoffStep | 'ask', string> = {
  ask: 'Type your question',
  fullName: 'Your full name',
  mobile: 'Your mobile number',
  email: 'Your email address',
  concern: 'What you need help with',
}

const INPUT_ID = 'support-chat-input'
const OPEN_KEY = 'support-chat:open'

/** Whether the panel was left open in this tab, so it stays open across page changes. */
function readOpen() {
  try {
    return window.sessionStorage.getItem(OPEN_KEY) === '1'
  } catch (error) {
    console.warn('Could not read the help chat state', error)
    return false
  }
}

function saveOpen(open: boolean) {
  try {
    if (open) window.sessionStorage.setItem(OPEN_KEY, '1')
    else window.sessionStorage.removeItem(OPEN_KEY)
  } catch (error) {
    console.warn('Could not save the help chat state', error)
  }
}

function focusInput() {
  document.getElementById(INPUT_ID)?.focus()
}

function inputKey(mode: ChatMode): HandoffStep | 'ask' {
  return mode.type === 'handoff' ? mode.step : 'ask'
}

/**
 * Floating help chat on storefront pages. It answers from the help guides
 * only and, when it can't help, collects contact details and opens a
 * support request for the team.
 */
export default function SupportChat({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(readOpen)
  const [text, setText] = useState('')
  const panelId = useId()
  const titleId = useId()
  const launcherRef = useRef<HTMLButtonElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const { data: me } = useQuery({
    queryKey: customerKeys.me,
    queryFn: fetchCustomerMe,
    enabled: signedIn,
  })
  const profile = useMemo(
    () => (signedIn && me ? { fullName: me.fullName, email: me.email, phone: me.phone } : null),
    [signedIn, me]
  )
  const chat = useSupportChat({ profile, signedIn })
  const { start } = chat
  const key = inputKey(chat.mode)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(SUPPORT_CHAT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(SUPPORT_CHAT_OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    saveOpen(open)
    if (!open) return
    start()
    focusInput()
  }, [open, start])

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'end' })
  }, [open, chat.entries.length, chat.typing, chat.mode.type, chat.chips.length])

  useEffect(() => {
    if (open && !chat.busy && chat.mode.type !== 'review') focusInput()
  }, [open, chat.busy, chat.mode])

  const minimise = () => {
    setOpen(false)
    window.requestAnimationFrame(() => launcherRef.current?.focus())
  }

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (chat.send(text)) setText('')
  }

  const onTextareaKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const onPanelKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') minimise()
  }

  return (
    <>
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-controls={panelId}
          aria-expanded={false}
          className="fixed right-4 bottom-4 z-[25] inline-flex h-12 items-center gap-2 rounded-full bg-sf-accent pr-4 pl-3.5 text-[14px] font-semibold text-sf-text shadow-lg transition-[opacity,scale] duration-150 hover:opacity-90 active:scale-96 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none print:hidden"
        >
          <MessageCircle size={20} />
          <span>Help</span>
        </button>
      )}

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          onKeyDown={onPanelKey}
          className="fixed inset-0 z-[25] flex flex-col bg-sf-surface text-sf-text [--btn-fg:var(--sf-text)] [--btn:var(--sf-accent)] sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[min(640px,calc(100dvh-2rem))] sm:w-[380px] sm:overflow-hidden sm:rounded-card sm:border sm:border-sf-line sm:shadow-2xl print:hidden"
        >
          <header className="flex flex-none items-center gap-2 border-b border-sf-line px-4 py-3">
            <span className="grid size-9 flex-none place-items-center rounded-full bg-sf-accent text-sf-text">
              <MessageCircle size={18} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <h2 id={titleId} className="truncate text-[15px] font-semibold">
                {AGENT_NAME}
              </h2>
              <p className="truncate text-[12px] text-sf-muted">Replies instantly</p>
            </div>
            <button
              type="button"
              onClick={chat.reset}
              disabled={chat.busy}
              className={cn(storefront.iconButton, 'size-9 border-transparent disabled:opacity-55')}
              aria-label="New chat"
              title="New chat"
            >
              <SquarePen size={16} />
            </button>
            <button
              type="button"
              onClick={minimise}
              className={cn(storefront.iconButton, 'size-9 border-transparent')}
              aria-label="Minimise chat"
              title="Minimise"
            >
              <Minus size={18} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4">
            <ol className="flex flex-col gap-3" aria-live="polite" aria-relevant="additions">
              {chat.entries.map((entry) => (
                <ChatEntryView key={entry.id} entry={entry} />
              ))}
              {chat.typing && <TypingIndicator />}
            </ol>

            {chat.mode.type === 'review' && !chat.typing && (
              <div className="mt-3">
                <HandoffSummary
                  draft={chat.draft}
                  steps={chat.asked}
                  accountEmail={profile && !chat.asked.includes('email') ? profile.email : null}
                  sending={chat.sending}
                  disabled={chat.busy}
                  onEdit={chat.editField}
                  onSend={() => void chat.submit()}
                  onCancel={chat.cancelHandoff}
                />
                <RecaptchaNotice className="mt-2 text-sf-muted" />
              </div>
            )}

            {!chat.typing && chat.chips.length > 0 && (
              <div className="mt-3">
                <QuickReplies chips={chat.chips} disabled={chat.busy} onPick={chat.pickChip} />
              </div>
            )}
            <div ref={endRef} aria-hidden="true" className="h-6" />
          </div>

          {chat.mode.type !== 'review' && (
            <form
              onSubmit={submit}
              noValidate
              className="flex flex-none items-end gap-2 border-t border-sf-line px-3 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <div className="min-w-0 flex-1">
                {key === 'concern' ? (
                  <FormTextarea
                    name={INPUT_ID}
                    label={inputLabels[key]}
                    hideLabel
                    rows={3}
                    maxLength={MAX_SUPPORT_MESSAGE_LENGTH}
                    placeholder="Describe your question or problem…"
                    value={text}
                    error={chat.fieldError ?? undefined}
                    onKeyDown={onTextareaKey}
                    onChange={(event) => {
                      setText(event.target.value)
                      chat.clearFieldError()
                    }}
                  />
                ) : (
                  <FormInput
                    name={INPUT_ID}
                    label={inputLabels[key]}
                    hideLabel
                    type={key === 'email' ? 'email' : key === 'mobile' ? 'tel' : 'text'}
                    autoComplete={
                      key === 'email'
                        ? 'email'
                        : key === 'mobile'
                          ? 'tel'
                          : key === 'fullName'
                            ? 'name'
                            : 'off'
                    }
                    maxLength={key === 'ask' ? MAX_SUPPORT_CHAT_QUESTION_LENGTH : 254}
                    placeholder={key === 'ask' ? 'Ask a question…' : inputLabels[key]}
                    value={text}
                    error={chat.fieldError ?? undefined}
                    onChange={(event) => {
                      setText(event.target.value)
                      chat.clearFieldError()
                    }}
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={chat.busy || !text.trim()}
                className={cn(
                  storefront.primaryButton,
                  'size-10 flex-none px-0 disabled:opacity-55'
                )}
                aria-label="Send"
              >
                <SendHorizontal size={18} />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
