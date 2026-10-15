import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type z } from 'zod'
import { HttpError } from '~/lib/http'
import { loadRecaptcha } from '~/lib/recaptcha'
import { useAskSupportChat, useCreateSupportTicket } from '~/pages/support/_hooks'
import {
  MAX_SUPPORT_TRANSCRIPT_ENTRIES,
  SupportConcernSchema,
  SupportEmailSchema,
  SupportFullNameSchema,
  SupportMobileSchema,
  type SupportChatLink,
  type SupportChatReply,
  type SupportTicketCreated,
  type SupportTicketForm,
} from '~/pages/support/_types'
import { chatPhrases, chipLabels } from './phrases'
import {
  HANDOFF_STEPS,
  StoredChatSchema,
  type ChatEntry,
  type Chip,
  type ChipAction,
  type HandoffStep,
} from './_types'

const STORAGE_KEY = 'support-chat:v1'
const MAX_STORED_ENTRIES = 60
const MIN_TYPING_MS = 400
const MAX_TYPING_MS = 900

const stepSchemas: Record<HandoffStep, z.ZodType<string>> = {
  fullName: SupportFullNameSchema,
  mobile: SupportMobileSchema,
  email: SupportEmailSchema,
  concern: SupportConcernSchema,
}

export type ChatDraft = Record<HandoffStep, string>

const emptyDraft: ChatDraft = { fullName: '', mobile: '', email: '', concern: '' }

export type ChatMode =
  { type: 'ask' } | { type: 'handoff'; step: HandoffStep; editing: boolean } | { type: 'review' }

export type ChatProfile = { fullName: string | null; email: string; phone: string | null } | null

type BotItem =
  | { text: string; private?: boolean }
  | { links: SupportChatLink[] }
  | { sent: SupportTicketCreated }

let nextId = 0
const newId = () => `${Date.now().toString(36)}-${(nextId++).toString(36)}`

function firstNameOf(fullName: string | null | undefined) {
  return fullName?.trim().split(/\s+/)[0] ?? ''
}

function typingDelay(item: BotItem) {
  const length = 'text' in item ? item.text.length : 60
  return Math.min(MAX_TYPING_MS, MIN_TYPING_MS + length * 4)
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function promptFor(step: HandoffStep, fullName: string | null | undefined) {
  return step === 'mobile' ? chatPhrases.ask.mobile(firstNameOf(fullName)) : chatPhrases.ask[step]
}

function toEntry(item: BotItem): ChatEntry {
  const at = new Date().toISOString()
  if ('links' in item) return { id: newId(), at, kind: 'links', links: item.links }
  if ('sent' in item) return { id: newId(), at, kind: 'sent', ...item.sent }
  return { id: newId(), at, kind: 'text', role: 'bot', text: item.text, private: item.private }
}

function readStored() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = StoredChatSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch (error) {
    console.warn('Could not restore the help chat', error)
    return null
  }
}

function suggestionChips(suggestions: string[]): Chip[] {
  return suggestions.map((text) => ({ label: text, action: { type: 'ask', text } }))
}

function chipsFor(reply: SupportChatReply): Chip[] {
  const suggestions = suggestionChips(reply.suggestions)
  if (reply.offerHandoff) {
    return [{ label: chipLabels.handoffYes, action: { type: 'handoff' } }, ...suggestions]
  }
  if (reply.intent === 'answer' || reply.intent === 'unsure' || reply.intent === 'order_status') {
    return [
      { label: chipLabels.helped, action: { type: 'helped' } },
      { label: chipLabels.notQuite, action: { type: 'not_quite' } },
      { label: chipLabels.handoff, action: { type: 'handoff' } },
      ...suggestions,
    ]
  }
  return suggestions
}

/**
 * State for the storefront help chat: the conversation, quick replies and
 * the step-by-step handoff to the team. The conversation (without contact
 * details) is kept in sessionStorage so it survives page changes.
 */
export function useSupportChat({ profile, signedIn }: { profile: ChatProfile; signedIn: boolean }) {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [chips, setChips] = useState<Chip[]>([])
  const [questions, setQuestions] = useState<string[]>([])
  const [misses, setMisses] = useState(0)
  const [mode, setMode] = useState<ChatMode>({ type: 'ask' })
  const [draft, setDraft] = useState<ChatDraft>(emptyDraft)
  const [typing, setTyping] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const mounted = useRef(true)
  const ask = useAskSupportChat()
  const create = useCreateSupportTicket()

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!started) return
    const stored = {
      entries: entries
        .filter((entry) => entry.kind === 'links' || (entry.kind === 'text' && !entry.private))
        .slice(-MAX_STORED_ENTRIES),
      chips: mode.type === 'ask' ? chips.slice(0, 8) : [],
      questions,
      misses,
    }
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch (error) {
      console.warn('Could not save the help chat', error)
    }
  }, [started, entries, chips, questions, misses, mode.type])

  const append = useCallback((entry: ChatEntry) => {
    setEntries((current) => [...current, entry])
  }, [])

  const userSays = useCallback(
    (text: string, isPrivate = false) => {
      append({
        id: newId(),
        at: new Date().toISOString(),
        kind: 'text',
        role: 'user',
        text,
        private: isPrivate,
      })
    },
    [append]
  )

  /** Bot bubbles one at a time, each after a short typing pause. */
  const say = useCallback(
    async (items: BotItem[]) => {
      const animate = !prefersReducedMotion()
      for (const item of items) {
        if (animate) {
          setTyping(true)
          await sleep(typingDelay(item))
          if (!mounted.current) return
          setTyping(false)
        }
        append(toEntry(item))
      }
    },
    [append]
  )

  const run = useCallback(async (task: () => Promise<void>) => {
    setBusy(true)
    try {
      await task()
    } finally {
      if (mounted.current) {
        setBusy(false)
        setTyping(false)
      }
    }
  }, [])

  const welcome = useCallback(
    () =>
      run(async () => {
        await say([
          { text: chatPhrases.welcome(firstNameOf(profile?.fullName) || null) },
          { text: chatPhrases.welcomeDisclaimer },
          { text: chatPhrases.welcomePrompt },
        ])
      }),
    [run, say, profile?.fullName]
  )

  /** First open: restore this tab's conversation, or say hello. */
  const start = useCallback(() => {
    if (started) return
    setStarted(true)
    const stored = readStored()
    if (stored && stored.entries.length > 0) {
      setEntries(stored.entries)
      setChips(stored.chips)
      setQuestions(stored.questions)
      setMisses(stored.misses)
      return
    }
    void welcome()
  }, [started, welcome])

  const reset = useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY)
    setEntries([])
    setChips([])
    setQuestions([])
    setMisses(0)
    setMode({ type: 'ask' })
    setDraft(emptyDraft)
    setFieldError(null)
    void welcome()
  }, [welcome])

  /** Contact details a signed-in customer's account already gives us. */
  const known = useMemo<HandoffStep[]>(() => {
    if (!signedIn || !profile) return []
    const fromProfile: ChatDraft = {
      fullName: profile.fullName ?? '',
      mobile: profile.phone ?? '',
      email: profile.email,
      concern: '',
    }
    return HANDOFF_STEPS.filter(
      (step) => step !== 'concern' && stepSchemas[step].safeParse(fromProfile[step]).success
    )
  }, [signedIn, profile])

  /** Questions the customer has to answer: everything the account doesn't cover. */
  const asked = useMemo(() => HANDOFF_STEPS.filter((step) => !known.includes(step)), [known])

  const goToStep = useCallback(
    async (step: HandoffStep | undefined, values: ChatDraft) => {
      if (!step) {
        setMode({ type: 'review' })
        await say([{ text: chatPhrases.review }])
        return
      }
      setMode({ type: 'handoff', step, editing: false })
      await say([{ text: promptFor(step, values.fullName || profile?.fullName), private: true }])
    },
    [say, profile?.fullName]
  )

  const startHandoff = useCallback(
    () =>
      run(async () => {
        setChips([])
        setMisses(0)
        setFieldError(null)
        loadRecaptcha().catch((error: unknown) => {
          console.warn('reCAPTCHA did not preload', error)
        })
        setDraft(emptyDraft)
        const onlyConcern = asked.length === 1
        await say([
          { text: onlyConcern ? chatPhrases.handoffStartKnown : chatPhrases.handoffStart },
        ])
        await goToStep(asked[0], emptyDraft)
        setChips([{ label: chipLabels.cancel, action: { type: 'cancel_handoff' } }])
      }),
    [run, say, goToStep, asked]
  )

  const askQuestion = useCallback(
    (question: string) =>
      run(async () => {
        setChips([])
        setQuestions((current) => [...current, question].slice(-MAX_SUPPORT_TRANSCRIPT_ENTRIES))
        let reply: SupportChatReply
        try {
          reply = await ask.mutateAsync(question)
        } catch (error) {
          const message =
            error instanceof HttpError && error.status === 429 ? error.message : chatPhrases.error
          await say([{ text: message }])
          return
        }
        const items: BotItem[] = reply.messages.map((text) => ({ text }))
        if (reply.links.length > 0) items.push({ links: reply.links })
        await say(items)
        if (reply.intent === 'human') {
          await startHandoff()
          return
        }
        setChips(chipsFor(reply))
      }),
    [run, ask, say, startHandoff]
  )

  /** A typed answer to the current handoff question. */
  const answerStep = useCallback(
    (step: HandoffStep, editing: boolean, value: string): boolean => {
      const parsed = stepSchemas[step].safeParse(value)
      if (!parsed.success) {
        setFieldError(parsed.error.issues[0]?.message ?? 'Please check this answer')
        return false
      }
      setFieldError(null)
      const values = { ...draft, [step]: parsed.data }
      setDraft(values)
      userSays(parsed.data, true)
      void run(async () => {
        if (editing) {
          await goToStep(undefined, values)
          return
        }
        await goToStep(asked[asked.indexOf(step) + 1], values)
      })
      return true
    },
    [draft, userSays, run, goToStep, asked]
  )

  /** False when the text was not accepted (busy, empty, or a handoff answer failed its check). */
  const send = useCallback(
    (text: string): boolean => {
      const value = text.trim()
      if (!value || busy || mode.type === 'review') return false
      if (mode.type === 'handoff') return answerStep(mode.step, mode.editing, value)
      userSays(value)
      void askQuestion(value)
      return true
    },
    [busy, mode, answerStep, userSays, askQuestion]
  )

  const editField = useCallback(
    (step: HandoffStep) => {
      setFieldError(null)
      setMode({ type: 'handoff', step, editing: true })
      void run(async () => {
        await say([{ text: promptFor(step, draft.fullName || profile?.fullName), private: true }])
      })
    },
    [run, say, draft, profile?.fullName]
  )

  const cancelHandoff = useCallback(() => {
    setMode({ type: 'ask' })
    setFieldError(null)
    setDraft(emptyDraft)
    setChips([])
    void run(async () => {
      await say([{ text: chatPhrases.handoffCancelled }])
    })
  }, [run, say])

  const submit = useCallback(
    () =>
      run(async () => {
        try {
          const payload: SupportTicketForm = { concern: draft.concern, transcript: questions }
          for (const step of asked) {
            if (step !== 'concern') payload[step] = draft[step]
          }
          const created = await create.mutateAsync(payload)
          setMode({ type: 'ask' })
          setDraft(emptyDraft)
          setChips([])
          setQuestions([])
          await say([
            { sent: created },
            { text: chatPhrases.sent(created.reference) },
            { text: chatPhrases.sentEmail(created.email), private: true },
            ...(created.accountTicketId ? [{ text: chatPhrases.sentAccount }] : []),
          ])
        } catch (error) {
          if (error instanceof HttpError) {
            const field = HANDOFF_STEPS.find((step) => error.fieldErrors[step])
            if (field) {
              setMode({ type: 'handoff', step: field, editing: true })
              setFieldError(error.fieldErrors[field] ?? null)
              await say([
                { text: promptFor(field, draft.fullName || profile?.fullName), private: true },
              ])
              return
            }
            await say([{ text: `${chatPhrases.sendFailed} ${error.message}` }])
            return
          }
          await say([{ text: chatPhrases.sendFailed }])
        }
      }),
    [run, create, draft, questions, asked, say, profile?.fullName]
  )

  const pickChip = useCallback(
    (chip: Chip) => {
      if (busy) return
      const action: ChipAction = chip.action
      switch (action.type) {
        case 'ask':
          userSays(action.text)
          void askQuestion(action.text)
          return
        case 'helped':
          userSays(chip.label)
          setChips([])
          setMisses(0)
          void run(async () => {
            await say([{ text: chatPhrases.helpedFollowUp }])
          })
          return
        case 'not_quite': {
          userSays(chip.label)
          const nextMisses = misses + 1
          setMisses(nextMisses)
          if (nextMisses >= 2) {
            setChips([{ label: chipLabels.handoffYes, action: { type: 'handoff' } }])
            void run(async () => {
              await say([{ text: chatPhrases.notQuiteAgain }, { text: chatPhrases.offerTeam }])
            })
            return
          }
          setChips([{ label: chipLabels.handoff, action: { type: 'handoff' } }])
          void run(async () => {
            await say([{ text: chatPhrases.notQuite }])
          })
          return
        }
        case 'handoff':
          userSays(chip.label)
          void startHandoff()
          return
        case 'cancel_handoff':
          userSays(chip.label)
          cancelHandoff()
          return
      }
    },
    [busy, userSays, askQuestion, run, say, misses, startHandoff, cancelHandoff]
  )

  return {
    entries,
    chips,
    mode,
    draft,
    asked,
    typing,
    busy,
    fieldError,
    clearFieldError: () => setFieldError(null),
    start,
    reset,
    send,
    pickChip,
    editField,
    cancelHandoff,
    submit,
    sending: create.isPending,
  }
}
