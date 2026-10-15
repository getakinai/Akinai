import { Link } from '@adonisjs/inertia/react'
import { APP_NAME } from '~/lib/brand'
import { type NavRoute } from '~/components/nav_link'

export default function Logo({
  size = 26,
  route = 'home',
  className,
}: {
  size?: number
  route?: NavRoute
  className?: string
}) {
  return (
    <Link route={route} aria-label={APP_NAME} className={className ?? 'inline-flex text-ink'}>
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
    </Link>
  )
}
