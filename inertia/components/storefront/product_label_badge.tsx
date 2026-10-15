import { cn } from '~/lib/styles'
import { PRODUCT_LABEL_COLOR_CLASSES, type ProductLabelBadgeData } from '~/lib/product_label'

type ProductLabelBadgeProps = {
  label: ProductLabelBadgeData
  small?: boolean
  className?: string
}

export default function ProductLabelBadge({
  label,
  small = false,
  className,
}: ProductLabelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block max-w-full truncate rounded-md font-semibold',
        small ? 'px-1.5 text-[10.5px]' : 'px-2 py-0.5 text-[11.5px]',
        PRODUCT_LABEL_COLOR_CLASSES[label.color],
        className
      )}
    >
      {label.name}
    </span>
  )
}
