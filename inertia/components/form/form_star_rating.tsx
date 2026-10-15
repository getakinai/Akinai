import { useId } from 'react'
import { Rating } from '@smastrom/react-rating'
import { starItemStyles } from '~/components/ui/star_rating'
import { cn, field } from '~/lib/styles'

type FormStarRatingProps = {
  label: string
  value: number
  onChange: (value: number) => void
  error?: string
  disabled?: boolean
  className?: string
}

/**
 * Required 1–5 star input (keyboard and screen-reader friendly radio
 * group). Stars take the surrounding text color.
 */
export default function FormStarRating({
  label,
  value,
  onChange,
  error,
  disabled = false,
  className,
}: FormStarRatingProps) {
  const labelId = useId()
  const errorId = useId()

  return (
    <div className={field.wrapper}>
      <span id={labelId} className={field.label}>
        {label}
      </span>
      <div aria-describedby={error ? errorId : undefined}>
        <Rating
          value={value}
          onChange={onChange}
          isRequired
          isDisabled={disabled}
          visibleLabelId={labelId}
          itemStyles={starItemStyles}
          spaceBetween="small"
          className={cn('max-w-[180px]', className)}
        />
      </div>
      {error && (
        <span id={errorId} className={field.error}>
          {error}
        </span>
      )}
    </div>
  )
}
