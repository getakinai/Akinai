import { type ReactNode, useState } from 'react'
import { usePage } from '@inertiajs/react'
import FlashToasts from '~/components/flash_toasts'
import AdminSidebar from '~/components/admin/admin_sidebar'
import AdminTopbar from '~/components/admin/admin_topbar'
import { adminMain } from '~/lib/styles'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { url } = usePage()
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const sidebarOpen = openedAt === url
  const setSidebarOpen = (open: boolean) => setOpenedAt(open ? url : null)

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-paper">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px] min-[900px]:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* The only scroll container: the viewport never scrolls, so stray overflow can't widen the page. */}
      <div
        // Inertia resets and restores this element's scroll position on navigation.
        // eslint-disable-next-line react/no-unknown-property
        scroll-region=""
        className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain"
      >
        <AdminTopbar sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(true)} />
        <div className={adminMain}>{children}</div>
      </div>
      <FlashToasts />
    </div>
  )
}
