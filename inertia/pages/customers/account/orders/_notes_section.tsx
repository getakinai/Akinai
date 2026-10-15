import { useState } from 'react'
import { Reply } from 'lucide-react'
import { toast } from 'sonner'
import { FormButton, FormTextarea } from '~/components/form'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import type { FieldErrors } from '~/lib/http'
import { cn, storefront } from '~/lib/styles'
import { useCustomerOrderNotes, useReplyToOrderNote } from '../../_hooks'
import { CustomerOrderNoteReplyFormSchema, type CustomerOrderNote } from '../../_types'

type NotesSectionProps = {
  orderId: string
  formatDate: (iso: string) => string
}

export default function NotesSection({ orderId, formatDate }: NotesSectionProps) {
  const { data: notes, isLoading } = useCustomerOrderNotes(orderId)
  const list = notes ?? []

  if (isLoading) return null
  if (list.length === 0) return null

  return (
    <div className={cn(storefront.card, 'flex flex-col gap-4 p-5')}>
      <h2 className="text-[16px] font-semibold">Updates from us</h2>
      <ul className="flex flex-col gap-4">
        {list.map((note) => (
          <NoteThread key={note.id} orderId={orderId} note={note} formatDate={formatDate} />
        ))}
      </ul>
    </div>
  )
}

type NoteThreadProps = {
  orderId: string
  note: CustomerOrderNote
  formatDate: (iso: string) => string
}

function NoteThread({ orderId, note, formatDate }: NoteThreadProps) {
  const reply = useReplyToOrderNote(orderId)
  const [replying, setReplying] = useState(false)
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const fieldName = `note-reply-${note.id}`

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = CustomerOrderNoteReplyFormSchema.safeParse({ parentId: note.id, body })
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error))
      return
    }
    setErrors({})
    reply.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Reply sent')
        setBody('')
        setReplying(false)
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <li className="rounded-lg border border-sf-line bg-sf-surface-2 px-4 py-3 text-[14px]">
      <p className="mb-2 text-[12.5px] text-sf-muted">{formatDate(note.createdAt)}</p>
      <p className="break-words whitespace-pre-wrap text-sf-text">{note.body}</p>

      {note.replies.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2 border-l-2 border-sf-line pl-3">
          {note.replies.map((item) => (
            <li key={item.id}>
              <p className="text-[12.5px] text-sf-muted">
                {item.fromCustomer ? 'You' : 'Us'} · {formatDate(item.createdAt)}
              </p>
              <p className="break-words whitespace-pre-wrap text-sf-text">{item.body}</p>
            </li>
          ))}
        </ul>
      )}

      {replying ? (
        <form onSubmit={send} noValidate className="mt-3 flex flex-col gap-3">
          <FormTextarea
            name={fieldName}
            label="Your reply"
            rows={3}
            maxLength={2000}
            value={body}
            autoFocus
            disabled={reply.isPending}
            error={errors.body ?? errors.parentId}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <FormButton
              className="w-full sm:w-fit"
              loading={reply.isPending}
              loadingText="Sending…"
              disabled={body.trim() === ''}
            >
              Send reply
            </FormButton>
            <FormButton
              type="button"
              variant="secondary"
              className="w-full sm:w-fit"
              disabled={reply.isPending}
              onClick={() => {
                setReplying(false)
                setErrors({})
              }}
            >
              Cancel
            </FormButton>
          </div>
        </form>
      ) : (
        <FormButton
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 w-fit"
          onClick={() => setReplying(true)}
        >
          <Reply size={14} /> Reply
        </FormButton>
      )}
    </li>
  )
}
