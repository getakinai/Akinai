import { useEffect, useState } from 'react'
import { CircleAlert, FileCheck2 } from 'lucide-react'
import { toast } from 'sonner'
import { FormButton, FormImageUpload, FormTextarea } from '~/components/form'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import type { FieldErrors } from '~/lib/http'
import { cn, storefront } from '~/lib/styles'
import { customerPaymentProofImageUrl, useSubmitPaymentProof } from '../../_hooks'
import { type CustomerOrderDetail, PaymentProofFormSchema } from '../../_types'

type PaymentProofSectionProps = {
  order: CustomerOrderDetail
  formatDate: (iso: string) => string
}

/**
 * Lets the customer send proof of their bank transfer (a screenshot and/or
 * the payment details) while the order waits for payment, and shows what
 * they sent while staff review it.
 */
export default function PaymentProofSection({ order, formatDate }: PaymentProofSectionProps) {
  const proof = order.paymentProof
  const submitted = order.paymentStatus === 'payment_submitted'
  const [editing, setEditing] = useState(false)

  if (order.paymentMethod !== 'bank_transfer' || order.cancelled) return null
  if (order.paymentStatus !== 'pending' && !submitted) return null

  if (submitted && proof && !editing) {
    return (
      <div className={cn(storefront.card, 'flex flex-col gap-4 p-5 text-[14px]')}>
        <div className="flex gap-3">
          <FileCheck2 size={18} className="mt-0.5 flex-none text-sf-primary" />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Proof of payment sent</h2>
            <p className="text-sf-muted">
              Sent {formatDate(proof.submittedAt)}. We’ll confirm your order once we’ve matched your
              payment.
            </p>
          </div>
        </div>
        {proof.hasImage && (
          <a
            href={customerPaymentProofImageUrl(order.id, proof.submittedAt)}
            target="_blank"
            rel="noreferrer"
            className="block w-full max-w-[240px] overflow-hidden rounded-lg border border-sf-line focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            <img
              src={customerPaymentProofImageUrl(order.id, proof.submittedAt)}
              alt="Your payment screenshot"
              loading="lazy"
              className="aspect-[4/3] w-full bg-sf-surface-2 object-contain"
            />
          </a>
        )}
        {proof.details && (
          <p className="rounded-lg border border-sf-line bg-sf-surface-2 px-4 py-3 break-words whitespace-pre-wrap">
            {proof.details}
          </p>
        )}
        <FormButton
          type="button"
          variant="secondary"
          className="w-full sm:w-fit"
          onClick={() => setEditing(true)}
        >
          Replace proof
        </FormButton>
      </div>
    )
  }

  return (
    <PaymentProofForm
      orderId={order.id}
      rejectionReason={!submitted ? (proof?.rejectionReason ?? null) : null}
      replacing={submitted}
      onCancel={submitted ? () => setEditing(false) : undefined}
      onSent={() => setEditing(false)}
    />
  )
}

type PaymentProofFormProps = {
  orderId: string
  rejectionReason: string | null
  replacing: boolean
  onCancel?: () => void
  onSent: () => void
}

function PaymentProofForm({
  orderId,
  rejectionReason,
  replacing,
  onCancel,
  onSent,
}: PaymentProofFormProps) {
  const submit = useSubmitPaymentProof(orderId)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  function selectImage(file: File | null) {
    setImage(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = PaymentProofFormSchema.safeParse({ image, details })
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error))
      return
    }
    setErrors({})
    submit.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Thanks! We’ve received your proof of payment')
        selectImage(null)
        setDetails('')
        onSent()
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn(storefront.card, 'flex flex-col gap-4 p-5 text-[14px]')}
    >
      {rejectionReason && (
        <div
          role="alert"
          className="flex gap-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3"
        >
          <CircleAlert size={18} className="mt-0.5 flex-none text-danger" />
          <div className="min-w-0">
            <p className="font-semibold">We couldn’t confirm your payment</p>
            <p className="break-words text-sf-muted">{rejectionReason}</p>
          </div>
        </div>
      )}
      <div>
        <h2 className="font-semibold">
          {replacing ? 'Replace your proof of payment' : 'Already paid? Send us your proof'}
        </h2>
        <p className="text-sf-muted">
          Upload a screenshot of your bank transfer, or tell us when and from which account you
          paid. This helps us confirm your order faster.
          {replacing && ' What you send now replaces your previous proof.'}
        </p>
      </div>
      <FormImageUpload
        name="paymentProofImage"
        label="Screenshot (optional)"
        image={preview ? { key: 'preview', url: preview } : null}
        accept="image/jpeg,image/png,image/webp"
        fit="contain"
        aspect="wide"
        uploadLabel="Choose screenshot"
        hint="JPG, PNG or WebP, up to 5 MB."
        disabled={submit.isPending}
        error={errors.image}
        onSelect={selectImage}
        onRemove={() => selectImage(null)}
      />
      <FormTextarea
        name="paymentProofDetails"
        label="Payment details (optional)"
        rows={3}
        maxLength={1000}
        placeholder="e.g. Paid on 9 Oct from ANZ account ending 1234"
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        disabled={submit.isPending}
        error={errors.details ?? errors.order}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <FormButton
          className="w-full sm:w-fit"
          loading={submit.isPending}
          loadingText="Sending…"
          disabled={!image && details.trim() === ''}
        >
          Send proof of payment
        </FormButton>
        {onCancel && (
          <FormButton
            type="button"
            variant="secondary"
            className="w-full sm:w-fit"
            disabled={submit.isPending}
            onClick={onCancel}
          >
            Cancel
          </FormButton>
        )}
      </div>
    </form>
  )
}
