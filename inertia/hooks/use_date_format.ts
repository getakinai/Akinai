import { useMemo } from 'react'
import {
  compactTimeAgo,
  dateContextFromStore,
  formatDate,
  formatDateTime,
  formatLongDate,
  formatTime,
  isAfter,
  isToday,
  timeAgo,
  type DateInput,
} from '~/lib/date'
import { useStoreSettings } from '~/pages/_hooks'

/**
 * Formats dates and times in the store time zone (`/store/settings`). A
 * Philippines-based staff member still sees an NZ order at the NZ local time
 * it was placed, because the server stores UTC and we project with the store
 * zone — never `Intl` with an omitted time zone (browser local).
 */
export function useDateFormat() {
  const { data: settings } = useStoreSettings()
  const ctx = useMemo(() => dateContextFromStore(settings), [settings])

  return useMemo(
    () => ({
      ctx,
      formatDate: (value: DateInput) => formatDate(value, ctx),
      formatDateTime: (value: DateInput) => formatDateTime(value, ctx),
      formatTime: (value: DateInput) => formatTime(value, ctx),
      formatLongDate: (value: DateInput) => formatLongDate(value, ctx),
      /** Order placed / refund / fulfillment timestamps (null → em dash). */
      formatOrderDate: (value: string | null) => (value ? formatDateTime(value, ctx) : '—'),
      timeAgo: (value: DateInput) => timeAgo(value),
      compactTimeAgo: (value: DateInput) => compactTimeAgo(value),
      isToday: (value: DateInput) => isToday(value, ctx),
      isAfter: (value: DateInput, other: DateInput) => isAfter(value, other),
    }),
    [ctx]
  )
}
