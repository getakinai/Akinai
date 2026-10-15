import { useState } from 'react'
import { CircleCheck, ExternalLink, Maximize2, X } from 'lucide-react'
import { toast } from 'sonner'
import { FormButton, FormTextarea } from '~/components/form'
import { Badge, Dialog } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { buttonClasses, card } from '~/lib/styles'
import { orderLabel } from './_format'
import { adminPaymentProofImageUrl, useReviewPaymentProof } from './_hooks'
import { AdminPaymentProofReviewPayloadSchema, type AdminOrderDetail } from './_types'

type PaymentProofCardProps = {
  order: AdminOrderDetail
  canReview: boolean
}

/**
 * The proof of bank transfer payment the customer sent. Staff with
 * `orders.edit` mark the order paid or reject the proof with a reason
 * the customer sees.
 */
export default function PaymentProofCard({ order, canReview }: PaymentProofCardProps) {
  const { formatOrderDate } = useDateFormat()
  const review = useReviewPaymentProof(order.id)
  const [rejecting, setRejecting] = useState(false)
  const [viewingImage, setViewingImage] = useState(false)
  const proof = order.paymentProof

  if (!proof) return null

  const awaitingReview = order.status === 'open' && order.paymentStatus === 'payment_submitted'
  const imageUrl = adminPaymentProofImageUrl(order.id, proof.submittedAt)

  const approve = () =>
    review.mutate(
      { decision: 'approve' },
      {
        onSuccess: (saved) => toast.success(`Order ${orderLabel(saved)} marked as paid`),
        onError: (error) => handleMutationError(error, () => {}),
      }
    )

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Proof of payment</span>
          <h2 className={card.title}>Sent {formatOrderDate(proof.submittedAt)}</h2>
        </div>
        {awaitingReview ? (
          <Badge tone="info" dot>
            Awaiting review
          </Badge>
        ) : proof.rejectionReason ? (
          <Badge tone="warning" dot>
            Rejected
          </Badge>
        ) : proof.reviewedAt ? (
          <Badge tone="success" dot>
            Approved
          </Badge>
        ) : null}
      </header>

      <div className="flex flex-col gap-4 text-[13.5px]">
        <div className="flex items-start gap-3">
          {proof.hasImage && (
            <button
              type="button"
              onClick={() => setViewingImage(true)}
              className="group relative block size-24 shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-line-2 bg-paper transition-[border-color,scale] duration-150 hover:border-ink-2 active:scale-96 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              <img
                src={imageUrl}
                alt="Customer’s payment screenshot"
                loading="lazy"
                width={96}
                height={96}
                className="size-full object-cover"
              />
              <span className="absolute right-1 bottom-1 grid size-6 place-items-center rounded-md bg-card/90 text-ink-2 shadow-sm">
                <Maximize2 size={12} />
              </span>
              <span className="sr-only">View full size</span>
            </button>
          )}
          {proof.details ? (
            <p className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 break-words whitespace-pre-wrap text-ink-2">
              {proof.details}
            </p>
          ) : (
            <p className="min-w-0 flex-1 text-muted">No details were given.</p>
          )}
        </div>
        {proof.rejectionReason && !awaitingReview && (
          <p className="text-ink-2">
            <span className="font-medium text-ink">Rejection reason:</span> {proof.rejectionReason}
          </p>
        )}
        {order.bankReference && awaitingReview && (
          <p className="text-muted">
            Look for a transfer of the order total with reference{' '}
            <span className="font-mono text-ink">{order.bankReference}</span>.
          </p>
        )}

        {canReview && awaitingReview && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <FormButton
              type="button"
              className="w-full sm:w-fit"
              loading={review.isPending && !rejecting}
              loadingText="Saving…"
              disabled={review.isPending}
              onClick={approve}
            >
              <CircleCheck size={14} /> Mark as paid
            </FormButton>
            <FormButton
              type="button"
              variant="secondary"
              className="w-full sm:w-fit"
              disabled={review.isPending}
              onClick={() => setRejecting(true)}
            >
              <X size={14} /> Reject
            </FormButton>
          </div>
        )}
      </div>

      {rejecting && <RejectDialog review={review} onClose={() => setRejecting(false)} />}
      {proof.hasImage && (
        <Dialog
          open={viewingImage}
          onClose={() => setViewingImage(false)}
          title="Proof of payment"
          description={`Sent ${formatOrderDate(proof.submittedAt)}`}
          className="w-[min(860px,calc(100vw-24px))]"
        >
          <div className="overflow-hidden rounded-lg border border-line-2 bg-paper">
            <img
              src={imageUrl}
              alt="Customer’s payment screenshot"
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
          <div className="flex justify-end">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses({ variant: 'secondary', size: 'sm' })}
            >
              <ExternalLink size={14} /> Open in new tab
            </a>
          </div>
        </Dialog>
      )}
    </section>
  )
}

type RejectDialogProps = {
  review: ReturnType<typeof useReviewPaymentProof>
  onClose: () => void
}

function RejectDialog({ review, onClose }: RejectDialogProps) {
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const save = () => {
    const parsed = AdminPaymentProofReviewPayloadSchema.safeParse({ decision: 'reject', reason })
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error))
      return
    }
    setErrors({})
    review.mutate(parsed.data, {
      onSuccess: (saved) => {
        toast.success(`Proof rejected. Order ${orderLabel(saved)} is awaiting payment again`)
        onClose()
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Reject proof of payment?"
      description="The order goes back to awaiting payment. The customer sees your reason on their order and by email, and can send new proof."
      className="w-[min(520px,calc(100vw-24px))]"
    >
      {errors.order && <p className="text-[13.5px] text-danger">{errors.order}</p>}
      <FormTextarea
        name="payment-proof-reason"
        label="Reason (shown to the customer)"
        rows={3}
        maxLength={500}
        value={reason}
        disabled={review.isPending}
        error={errors.reason}
        placeholder="e.g. We can’t find a transfer with this reference yet."
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" disabled={review.isPending} onClick={onClose}>
          Keep reviewing
        </FormButton>
        <FormButton
          type="button"
          variant="danger"
          loading={review.isPending}
          loadingText="Rejecting…"
          onClick={save}
        >
          Reject proof
        </FormButton>
      </div>
    </Dialog>
  )
}
