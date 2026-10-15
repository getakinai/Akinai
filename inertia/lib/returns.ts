import { type BadgeTone } from '~/lib/styles'

export const returnReasonLabels: Record<string, string> = {
  size_too_small: 'Size too small',
  size_too_large: 'Size too large',
  not_as_described: 'Not as described',
  defective: 'Damaged or defective',
  wrong_item: 'Wrong item sent',
  changed_mind: 'Changed my mind',
  other: 'Other',
}

export const returnStatusMeta: Record<string, { label: string; tone: BadgeTone }> = {
  requested: { label: 'Requested', tone: 'warning' },
  approved: { label: 'Approved', tone: 'info' },
  declined: { label: 'Declined', tone: 'danger' },
  received: { label: 'Received', tone: 'purple' },
  closed: { label: 'Refunded', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

/** What a return's status means for the customer. */
export const returnStatusHelp: Record<string, string> = {
  requested: 'We’re reviewing your request. Please don’t send anything back yet.',
  approved: 'Approved. Please send the items back; check your email for instructions.',
  declined: 'We couldn’t accept this return.',
  received: 'We’ve received your items and will refund you shortly.',
  closed: 'Refunded.',
  cancelled: 'This return was cancelled.',
}
