import { Rating, RoundedStar, type ItemStyles } from '@smastrom/react-rating'
import '@smastrom/react-rating/style.css'
import { cn } from '~/lib/styles'

/**
 * Stars take the surrounding text color; set it with a `text-*` class.
 */
export const starItemStyles: ItemStyles = {
  itemShapes: RoundedStar,
  activeFillColor: 'currentColor',
  inactiveFillColor: 'color-mix(in oklab, currentColor 22%, transparent)',
}

const SIZES = {
  sm: 'max-w-[76px]',
  md: 'max-w-[104px]',
  lg: 'max-w-[136px]',
} as const

type StarRatingProps = {
  value: number
  size?: keyof typeof SIZES
  className?: string
}

/** Read-only star rating; fractional values fill part of a star. */
export default function StarRating({ value, size = 'md', className }: StarRatingProps) {
  return (
    <Rating
      readOnly
      value={value}
      itemStyles={starItemStyles}
      spaceBetween="small"
      className={cn(SIZES[size], className)}
    />
  )
}
