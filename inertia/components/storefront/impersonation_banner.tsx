import { UserRoundCog, X } from 'lucide-react'
import { cn, storefront } from '~/lib/styles'

type ImpersonationBannerProps = {
  customerName: string
  stopping: boolean
  onStop: () => void
}

/**
 * Strip shown to staff while they are signed in to the storefront as a
 * customer, with a button that ends it.
 */
export default function ImpersonationBanner({
  customerName,
  stopping,
  onStop,
}: ImpersonationBannerProps) {
  return (
    <div role="status" className="bg-ink text-paper">
      <div
        className={cn(
          storefront.container,
          'flex items-center justify-between gap-3 py-2 text-[12.5px] font-semibold'
        )}
      >
        <p className="flex min-w-0 items-center gap-2 break-words">
          <UserRoundCog size={14} className="flex-none" />
          <span className="min-w-0">
            You are impersonating <strong className="font-bold">{customerName}</strong>
          </span>
        </p>
        <button
          type="button"
          onClick={onStop}
          disabled={stopping}
          className="inline-flex flex-none items-center gap-1.5 rounded-md border border-paper/30 px-2.5 py-1.5 transition-colors hover:bg-paper/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-60"
        >
          <X size={14} />
          <span className="hidden sm:inline">{stopping ? 'Stopping…' : 'Stop impersonating'}</span>
          <span className="sr-only sm:hidden">Stop impersonating</span>
        </button>
      </div>
    </div>
  )
}
