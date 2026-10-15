import { Info } from 'lucide-react'
import { Link } from '@adonisjs/inertia/react'
import { useCan } from '../_hooks'
import { useAdminThemes } from './_hooks'

/** Tells staff editing built-in theme settings that shoppers currently see another theme. */
export default function LiveThemeNotice() {
  const canViewThemes = useCan('themes.view')
  return canViewThemes ? <Notice /> : null
}

function Notice() {
  const { data: themes } = useAdminThemes()
  const live = themes?.find((theme) => theme.role === 'live')
  if (!live) return null
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-lg border border-info/30 bg-info-soft p-3 text-[13px] text-ink"
    >
      <Info size={16} className="mt-px shrink-0 text-info" aria-hidden="true" />
      <p>
        <strong className="font-semibold">{live.name}</strong> is your live theme, so these settings
        only show on pages it doesn’t include, such as checkout. Manage themes in{' '}
        <Link route="admin.themes.home" className="font-medium underline underline-offset-2">
          Themes
        </Link>
        .
      </p>
    </div>
  )
}
