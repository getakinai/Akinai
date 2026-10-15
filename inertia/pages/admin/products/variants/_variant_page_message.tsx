import { type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { FormButton } from '~/components/form'
import { buttonClasses, card } from '~/lib/styles'

type VariantPageMessageProps = {
  productId: string
  children: ReactNode
  onRetry?: () => void
}

/**
 * Empty, error and blocked states for the variant pages, with a way back to
 * the parent product.
 */
export default function VariantPageMessage({
  productId,
  children,
  onRetry,
}: VariantPageMessageProps) {
  return (
    <div className={`${card.base} flex flex-col items-center gap-3 py-12 text-center`}>
      <span className="max-w-md text-[14px] text-muted">{children}</span>
      <div className="flex gap-2.5">
        {onRetry && (
          <FormButton type="button" variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </FormButton>
        )}
        <Link
          route="admin.products.edit"
          routeParams={{ id: productId }}
          className={buttonClasses({ variant: 'ghost', size: 'sm' })}
        >
          Back to product
        </Link>
      </div>
    </div>
  )
}
