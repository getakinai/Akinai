import { type ReactNode } from 'react'
import { storefront } from '~/lib/styles'

export default function SectionHeader({
  id,
  title,
  description,
  action,
}: {
  id?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:mb-5">
      <div className="min-w-0">
        <h2 id={id} className={storefront.sectionTitle}>
          {title}
        </h2>
        {description && <p className="mt-0.5 text-[14px] text-sf-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
