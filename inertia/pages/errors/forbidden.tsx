import { Link } from '@adonisjs/inertia/react'
import { ShieldAlert } from 'lucide-react'
import Page from '~/components/page'
import AdminLayout from '~/layouts/admin'
import { buttonClasses, card } from '~/lib/styles'

export default function Forbidden() {
  return (
    <Page eyebrow="Back office · 403" title="Access denied">
      <section className={`${card.base} flex flex-col items-center gap-3 px-6 py-12 text-center`}>
        <ShieldAlert size={28} className="text-subtle" />
        <p className="max-w-md text-[14px] text-muted">
          Your role doesn&apos;t have permission to view this page. Ask an admin to update your role
          if you need access.
        </p>
        <Link
          route="admin.dashboard.home"
          className={buttonClasses({ variant: 'secondary', size: 'sm' })}
        >
          Back to dashboard
        </Link>
      </section>
    </Page>
  )
}

Forbidden.layout = [AdminLayout]
