import { Link } from '@adonisjs/inertia/react'
import { APP_NAME } from '~/lib/brand'
import { type NavRoute } from '~/components/nav_link'

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="80" cy="80" r="80" fill="#000" />
      <text
        x="80"
        y="80"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="72"
        fontWeight="700"
        letterSpacing="-2"
      >
        AK
      </text>
    </svg>
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
