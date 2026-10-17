import { Link } from '@adonisjs/inertia/react'
import { APP_NAME } from '~/lib/brand'
import { type NavRoute } from '~/components/nav_link'
import akLogo from '~/images/AK.svg'

function LogoMark({ size }: { size: number }) {
  return (
    <img
      src={akLogo}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className="block"
      draggable={false}
    />
  )
}

export default function Logo({
  size = 26,
  route = 'home',
  className,
  linked = true,
}: {
  size?: number
  route?: NavRoute
  className?: string
  /** When false, render only the mark (for use inside another link). */
  linked?: boolean
}) {
  const mark = <LogoMark size={size} />
  if (!linked) {
    return <span className={className ?? 'inline-flex text-ink'}>{mark}</span>
  }
  return (
    <Link route={route} aria-label={APP_NAME} className={className ?? 'inline-flex text-ink'}>
      {mark}
    </Link>
  )
}
