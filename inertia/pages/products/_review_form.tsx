import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput, FormStarRating, FormTextarea } from '~/components/form'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useCreateProductReview } from './_hooks'
import { ProductReviewFormSchema, REVIEW_BODY_MAX, REVIEW_TITLE_MAX } from './_types'

type ReviewFormProps = {
  slug: string
  onCancel: () => void
  onCreated: () => void
}

export default function ReviewForm({ slug, onCancel, onCreated }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createReview = useCreateProductReview(slug)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = ProductReviewFormSchema.safeParse({
      rating,
      title: emptyToNull(title),
      body,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    createReview.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Thanks for your review!')
        onCreated()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form
      className="mt-4 flex flex-col gap-4 rounded-card border border-sf-line bg-sf-surface p-4"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="text-sf-primary">
        <FormStarRating
          label="Your rating"
          value={rating}
          onChange={setRating}
          error={errors.rating}
          disabled={createReview.isPending}
        />
      </div>
      <FormInput
        name="reviewTitle"
        label="Title (optional)"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={REVIEW_TITLE_MAX}
        error={errors.title}
      />
      <FormTextarea
        name="reviewBody"
        label="Your review"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={REVIEW_BODY_MAX}
        rows={5}
        placeholder="What did you like or dislike?"
        error={errors.body}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <FormButton type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </FormButton>
        <FormButton loading={createReview.isPending} loadingText="Posting…">
          Post review
        </FormButton>
      </div>
    </form>
  )
}
