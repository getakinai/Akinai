import { Link } from '@adonisjs/inertia/react'
import { FormButton } from '~/components/form'
import { Skeleton } from '~/components/ui'
import { buttonClasses, card } from '~/lib/styles'

export function UserSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Loading user"
    >
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className={`${card.base} flex flex-col gap-3`}>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export function UserLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={`${card.base} flex flex-col items-center gap-3 py-12 text-center`}>
      <span className="text-[14px] text-muted">Could not load this user.</span>
      <div className="flex flex-wrap justify-center gap-2.5">
        <FormButton type="button" variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </FormButton>
        <Link route="admin.users.home" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
          Back to users
        </Link>
      </div>
    </div>
  )
}
