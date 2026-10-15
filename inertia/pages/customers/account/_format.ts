import { useDateFormat } from '~/hooks/use_date_format'
import { FALLBACK_MONEY, formatMoney } from '~/lib/money'
import { useStoreSettings } from '~/pages/_hooks'

/** Money and date formatters that follow the store settings. */
export function useAccountFormat() {
  const { data: settings } = useStoreSettings()
  const money = settings ?? FALLBACK_MONEY
  const { formatDate, formatDateTime, formatTime, formatOrderDate } = useDateFormat()

  return {
    money: (amount: number, currencyCode: string) =>
      formatMoney(amount, { ...money, currencyCode }),
    date: (value: string) => formatDate(value),
    dateTime: (value: string) => formatDateTime(value),
    time: (value: string) => formatTime(value),
    orderDate: formatOrderDate,
  }
}
