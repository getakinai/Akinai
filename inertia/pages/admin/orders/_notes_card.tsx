import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSelect, FormTextarea } from '~/components/form'
import { Badge } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { card, cn } from '~/lib/styles'
import { AdminOrderNoteStorePayloadSchema, type OrderNoteVisibility } from './_types'
import { useAdminOrderNotes, useCreateAdminOrderNote } from './_hooks'

const visibilityOptions = [
  { value: 'internal', label: 'Internal — staff only' },
  { value: 'customer', label: 'Customer — visible on their order (emails them)' },
]

const visibilityMeta: Record<OrderNoteVisibility, { label: string; tone: 'neutral' | 'info' }> = {
  internal: { label: 'Internal', tone: 'neutral' },
  customer: { label: 'Customer', tone: 'info' },
}

type NotesCardProps = {
  orderId: string
  canAdd: boolean
  customerEmail: string | null
}

export default function NotesCard({ orderId, canAdd, customerEmail }: NotesCardProps) {
  const { formatOrderDate } = useDateFormat()
  const { data: notes, isLoading } = useAdminOrderNotes(orderId)
  const createNote = useCreateAdminOrderNote(orderId)
  const [visibility, setVisibility] = useState<OrderNoteVisibility>('internal')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const submit = () => {
    const parsed = AdminOrderNoteStorePayloadSchema.safeParse({ visibility, body })
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error))
      return
    }
    setErrors({})
    createNote.mutate(parsed.data, {
      onSuccess: (note) => {
        setBody('')
        toast.success(
          note.visibility === 'customer'
            ? 'Note saved and emailed to the customer'
            : 'Internal note saved'
        )
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  const showForm = canAdd
  const list = notes ?? []

  if (!showForm && list.length === 0 && !isLoading) return null

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Notes</span>
          <h2 className={card.title}>
            {list.length === 0
              ? 'No notes yet'
              : `${list.length} ${list.length === 1 ? 'note' : 'notes'}`}
          </h2>
        </div>
      </header>

      {showForm && (
        <div className="flex flex-col gap-3 border-b border-line pb-4">
          <FormSelect
            name="visibility"
            label="Who can see this?"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as OrderNoteVisibility)}
            options={visibilityOptions}
            disabled={createNote.isPending}
          />
          {visibility === 'customer' && !customerEmail && (
            <p className="text-[13px] text-warning">
              This order has no email address, so the customer will not be notified.
            </p>
          )}
          <FormTextarea
            name="body"
            label="Note"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            maxLength={2000}
            error={errors.body}
            disabled={createNote.isPending}
            placeholder="Add context for your team or a message for the customer…"
          />
          <div className="flex flex-wrap gap-2">
            <FormButton
              type="button"
              size="sm"
              loading={createNote.isPending}
              loadingText="Saving…"
              onClick={submit}
            >
              Add note
            </FormButton>
          </div>
        </div>
      )}

      {isLoading && <p className="text-[13px] text-muted">Loading notes…</p>}

      {list.length > 0 && (
        <ul className={cn('flex flex-col divide-y divide-line', showForm && 'pt-4')}>
          {list.map((note) => {
            const meta = visibilityMeta[note.visibility]
            return (
              <li key={note.id} className="flex flex-col gap-2 py-3 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={meta.tone} dot>
                      {meta.label}
                    </Badge>
                    {note.author && (
                      <span className="text-[13px] font-medium text-ink">{note.author}</span>
                    )}
                  </div>
                  <span className="text-[12.5px] text-muted">
                    {formatOrderDate(note.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-[13.5px] text-ink-2">{note.body}</p>
                {note.replies.length > 0 && (
                  <ul className="flex flex-col gap-2 border-l-2 border-line pl-3">
                    {note.replies.map((reply) => (
                      <li key={reply.id} className="flex flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="warning" dot>
                            Customer reply
                          </Badge>
                          <span className="text-[13px] font-medium text-ink">{reply.author}</span>
                          <span className="text-[12.5px] text-muted">
                            {formatOrderDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="break-words whitespace-pre-wrap text-[13.5px] text-ink-2">
                          {reply.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
