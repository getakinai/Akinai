export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-btn text-btn-fg hover:opacity-88',
  secondary:
    'border-line-2 bg-card text-ink hover:bg-paper disabled:border-line disabled:bg-paper disabled:text-muted',
  ghost: 'text-ink hover:text-muted',
  danger: 'border-danger/25 bg-danger-soft text-danger hover:border-danger/50',
}

const buttonSizes: Record<ButtonSize, string> = {
  md: 'h-[38px] px-[15px] text-[14px]',
  sm: 'h-[34px] px-3 text-[13.5px] after:absolute after:inset-x-0 after:-inset-y-[3px]',
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  className?: string
} = {}) {
  return cn(
    'relative inline-flex items-center justify-center gap-[7px] whitespace-nowrap rounded-lg border border-transparent font-medium transition-[opacity,background-color,border-color,color,scale] duration-150 active:not-disabled:scale-96 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45',
    focusRing,
    buttonVariants[variant],
    buttonSizes[size],
    block && 'w-full',
    className
  )
}

export const iconButton = cn(
  'relative inline-grid size-9 place-items-center rounded-lg border border-line text-muted transition-[background-color,color,border-color,scale] duration-150 after:absolute after:-inset-0.5 hover:border-line-2 hover:bg-card hover:text-ink active:scale-96',
  focusRing
)

export const field = {
  wrapper: 'flex flex-col gap-1.5',
  label: 'text-[13px] font-medium text-ink',
  input:
    'h-10 rounded-lg border border-line-2 bg-field px-3 text-[14px] text-ink shadow-[0_1px_1px_rgba(10,10,11,0.03)] transition-[border-color,box-shadow] duration-150 placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-3 focus:ring-ring aria-invalid:border-danger',
  error: 'text-[12.5px] text-danger',
}

export const inlineLink =
  'text-ink underline decoration-line-2 decoration-1 underline-offset-3 transition-[text-decoration-color] duration-150 hover:decoration-ink'

export const tag = 'font-mono text-[11px] uppercase tracking-[0.09em] text-subtle'

export const panel = 'rounded-card border border-line-2 bg-card p-7 max-[720px]:p-5'

/** Main content on the left, supporting panels on the right; stacks below 1100px. */
export const productFormGrid =
  'grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'

export const table =
  'w-full border-collapse text-[14px] [&_td]:border-b [&_td]:border-line [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-left [&_th]:border-b [&_th]:border-line [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-medium [&_th]:text-muted'

export type BadgeTone = 'primary' | 'success' | 'info' | 'warning' | 'purple' | 'danger' | 'neutral'

export const badgeTones: Record<BadgeTone, string> = {
  primary: 'bg-accent-soft text-accent',
  success: 'bg-ok-soft text-ok',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  purple: 'bg-purple-soft text-purple',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-line text-muted',
}

export const compactSelect =
  'h-[34px] w-full cursor-pointer appearance-none rounded-lg border border-line-2 bg-field pr-7 pl-2.5 text-[12.5px] text-ink transition-[border-color,box-shadow] duration-150 focus:border-ink focus:outline-none focus:ring-3 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-55'

/** Search field in list-page toolbars: full width on phones, capped on larger screens. */
export const listToolbarSearch = 'w-full min-w-0 flex-1 sm:max-w-[320px]'

export const dataTable = {
  /** Contained horizontal scroll — no negative margins (they widen the page on mobile). */
  scroller:
    'min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]',
  table: 'w-full border-collapse text-[13.5px] sm:min-w-[640px] lg:min-w-[900px]',
  th: 'h-11 border-b border-line px-3 text-left align-middle font-mono text-[10.5px] font-medium tracking-[0.12em] whitespace-nowrap text-subtle uppercase first:pl-3 last:pr-3 sm:first:pl-6 sm:last:pr-6',
  sortButton:
    'inline-flex items-center gap-1 uppercase tracking-[0.12em] transition-colors duration-150 hover:text-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
  row: 'transition-colors duration-150 hover:bg-paper/60',
  rowSelected: 'bg-accent-soft/60 hover:bg-accent-soft/80',
  td: 'h-[60px] border-b border-line px-3 align-middle text-ink-2 first:pl-3 last:pr-3 sm:first:pl-6 sm:last:pr-6',
  mono: 'font-mono text-[12px] text-muted',
  message: 'px-6 py-12 text-center text-[14px] text-muted',
}

/** Compact table previewing the rows of a CSV before it is imported. */
export const csvPreview = {
  wrapper: `${dataTable.scroller} max-h-72 overflow-y-auto rounded-lg border border-line-2`,
  table: 'w-full min-w-[620px] border-collapse text-[13px]',
  th: 'sticky top-0 z-[1] h-9 border-b border-line bg-card px-3 text-left font-mono text-[10.5px] font-medium tracking-[0.12em] whitespace-nowrap text-subtle uppercase',
  td: 'h-10 border-b border-line px-3 align-middle whitespace-nowrap text-ink-2',
}

export const appMain = 'flex min-h-[calc(100vh-108px)] bg-paper'

export const adminMain = 'flex min-w-0 flex-1 shrink-0 flex-col overflow-x-clip bg-paper'

export const card = {
  base: 'min-w-0 overflow-x-clip rounded-card border border-line-2 bg-card p-6 max-[720px]:p-5',
  head: 'mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-line pb-4',
  eyebrow: 'font-mono text-[10.5px] uppercase tracking-[0.12em] text-subtle',
  title: 'mt-1 text-[15.5px] font-semibold tracking-[-0.01em] text-ink',
  action:
    'inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-opacity duration-150 hover:opacity-80',
}

/** Storefront building blocks; colors come from the `sf-*` theme tokens. */
export const storefront = {
  container: 'mx-auto w-full max-w-[1200px] min-w-0 px-4 sm:px-6',
  section: 'mt-10 sm:mt-14',
  sectionTitle: 'text-[19px] font-semibold tracking-[-0.015em] text-sf-text sm:text-[22px]',
  menuLink:
    'inline-flex h-10 items-center rounded-lg px-3 text-[14px] font-medium whitespace-nowrap text-sf-text transition-colors duration-150 hover:bg-sf-primary-soft hover:text-sf-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
  primaryButton:
    'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sf-primary px-4 text-[14px] font-medium text-sf-primary-fg transition-[opacity,scale] duration-150 hover:opacity-90 active:scale-96 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
  secondaryButton:
    'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-sf-line bg-sf-surface px-4 text-[14px] font-medium text-sf-text transition-[background-color,scale] duration-150 hover:bg-sf-primary-soft active:scale-96 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
  accentButton:
    'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sf-accent px-4 text-[14px] font-semibold text-sf-text transition-[opacity,scale] duration-150 hover:opacity-90 active:scale-96 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
  iconButton:
    'relative inline-grid size-10 place-items-center rounded-lg border border-sf-line bg-sf-surface text-sf-text transition-[background-color,scale] duration-150 hover:bg-sf-primary-soft active:scale-96 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
  card: 'min-w-0 rounded-card border border-sf-line bg-sf-surface',
  richText:
    'space-y-2 break-words text-sf-muted [&_a]:text-sf-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-sf-line [&_blockquote]:pl-3 [&_h2]:font-semibold [&_h2]:text-sf-text [&_h3]:font-semibold [&_h3]:text-sf-text [&_h4]:font-semibold [&_h4]:text-sf-text [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-sf-text [&_ul]:list-disc [&_ul]:pl-5',
}

export const auth = {
  title: 'font-serif text-[27px] font-normal tracking-[0.2px] text-balance',
  subtitle: 'mt-1 text-[14px] text-muted',
  form: 'mt-[22px] flex flex-col gap-[15px]',
  foot: 'mt-6 text-center text-[13px] text-muted',
}
