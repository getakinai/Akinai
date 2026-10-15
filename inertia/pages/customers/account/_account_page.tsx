import { type ReactNode } from 'react'
import { Head } from '@inertiajs/react'
import { cn, storefront } from '~/lib/styles'

/**
 * Title row for an account page: optional back link eyebrow, heading,
 * description and wrapping actions.
 */
export default function AccountPage({
  title,
  heading,
  eyebrow,
  description,
  actions,
  children,
}: {
  title: string
  heading?: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <Head title={title} />
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          {eyebrow && <div className="mb-1 text-[13px] text-sf-muted">{eyebrow}</div>}
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] sm:text-[26px]">
            {heading ?? title}
          </h1>
          {description && <p className="mt-1 text-[14px] text-sf-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </>
  )
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div className={cn(storefront.card, 'flex flex-col items-center gap-2 p-8 text-center')}>
      <span className="grid size-11 place-items-center rounded-full bg-sf-primary-soft text-sf-primary">
        {icon}
      </span>
      <p className="text-[15px] font-semibold">{title}</p>
      <div className="flex flex-col items-center text-[13.5px] text-sf-muted">{children}</div>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className={cn(
        storefront.card,
        'flex flex-wrap items-center justify-between gap-3 p-4 text-[14px]'
      )}
    >
      <p className="text-danger">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-medium text-sf-primary hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  )
}
