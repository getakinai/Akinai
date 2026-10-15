import { TriangleAlert } from 'lucide-react'
import { cn, storefront } from '~/lib/styles'

/**
 * Danger strip shown to staff browsing the storefront while it is in
 * maintenance mode.
 */
export default function MaintenanceBanner() {
  return (
    <div role="status" className="bg-danger text-paper">
      <p
        className={cn(
          storefront.container,
          'flex items-center justify-center gap-2 py-2 text-center text-[12.5px] font-semibold break-words'
        )}
      >
        <TriangleAlert size={14} className="flex-none" />
        <span className="min-w-0">
          Maintenance mode is on. Customers can’t see the store right now. You can because you’re
          signed in as staff.
        </span>
      </p>
    </div>
  )
}
