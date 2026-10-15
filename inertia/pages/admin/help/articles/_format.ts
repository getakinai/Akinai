import { cn, type BadgeTone } from '~/lib/styles'
import { type HelpArticleStatus } from './_types'

export const helpArticleStatusMeta: Record<HelpArticleStatus, { label: string; tone: BadgeTone }> =
  {
    draft: { label: 'Draft', tone: 'neutral' },
    active: { label: 'Active', tone: 'success' },
    archived: { label: 'Archived', tone: 'warning' },
  }

/** Admin-theme version of the storefront help article body styles. */
export const helpArticlePreview = cn(
  'space-y-2 overflow-x-auto break-words text-[14px] leading-relaxed text-ink-2',
  '[&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-line-2 [&_blockquote]:pl-3',
  '[&_h2]:mt-6 [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:text-ink',
  '[&_h3]:mt-5 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-ink',
  '[&_h4]:font-semibold [&_h4]:text-ink [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-3',
  '[&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5',
  '[&_table]:mt-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[13px]',
  '[&_th]:border-b [&_th]:border-line [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left [&_th]:font-semibold',
  '[&_td]:border-b [&_td]:border-line [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top'
)
