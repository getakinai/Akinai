import { type BadgeTone } from '~/lib/styles'
import { type PageStatus, type PolicyType } from './_types'

export const pageStatusMeta: Record<PageStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  active: { label: 'Active', tone: 'success' },
  archived: { label: 'Archived', tone: 'warning' },
}

export const policyLabels: Record<PolicyType, string> = {
  refund: 'Refund policy',
  shipping: 'Shipping policy',
  privacy: 'Privacy policy',
  terms: 'Terms of service',
}
