import { type ReactNode } from 'react'
import { Head } from '@inertiajs/react'
import { card } from '~/lib/styles'

/**
 * The frame for an app page: sets the document title and renders the page
 * heading, an optional eyebrow and description, and optional actions
 * (buttons, links) aligned to the right. Pass `hideTitle` to only set the
 * document title.
 */
export default function Page({
  title,
  hideTitle = false,
  eyebrow,
  description,
  actions,
  children,
}: {
  title: string
  hideTitle?: boolean
  eyebrow?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) {
  const hasHeader = !hideTitle || description || actions

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col overflow-x-clip px-[30px] pt-10 pb-16 max-[720px]:px-4 max-[720px]:pt-7 max-[720px]:pb-12">
      <Head title={title} />
      {hasHeader && (
        <header className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0 flex-1">
            {eyebrow && !hideTitle && <span className={card.eyebrow}>{eyebrow}</span>}
            {!hideTitle && (
              <h1 className="text-[24px] leading-[1.25] font-semibold tracking-[-0.02em] max-[720px]:text-[21px]">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-[14.5px] text-pretty text-muted">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex w-full flex-wrap gap-2.5 sm:w-auto max-[480px]:[&>*]:min-w-0 max-[480px]:[&>*]:flex-1">
              {actions}
            </div>
          )}
        </header>
      )}
      {children}
    </div>
  )
}
