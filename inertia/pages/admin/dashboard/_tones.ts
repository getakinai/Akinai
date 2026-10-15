import type { Tone, Trend } from './_types'

export const toneText: Record<Tone, string> = {
  ok: 'text-ok',
  danger: 'text-danger',
  purple: 'text-purple',
  accent: 'text-accent',
  info: 'text-info',
  warning: 'text-warning',
}

export const toneBg: Record<Tone, string> = {
  ok: 'bg-ok',
  danger: 'bg-danger',
  purple: 'bg-purple',
  accent: 'bg-accent',
  info: 'bg-info',
  warning: 'bg-warning',
}

export const toneSoft: Record<Tone, string> = {
  ok: 'bg-ok-soft text-ok',
  danger: 'bg-danger-soft text-danger',
  purple: 'bg-purple-soft text-purple',
  accent: 'bg-accent-soft text-accent',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
}

export const trendSoft: Record<Trend, string> = {
  up: toneSoft.ok,
  down: toneSoft.danger,
  flat: toneSoft.info,
}

export const trendText: Record<Trend, string> = {
  up: 'text-ok',
  down: 'text-danger',
  flat: 'text-muted',
}
