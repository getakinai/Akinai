import { useCallback, useState } from 'react'
import { router } from '@inertiajs/react'
import { analyticsQueryString } from './_hooks'
import type { AnalyticsCompare, AnalyticsQuery } from './_types'

export type AnalyticsShellProps = {
  from: string | null
  to: string | null
  compare: AnalyticsCompare | null
}

/**
 * Date range and comparison for an analytics page. Starts from the shell's
 * validated query props and mirrors changes into the URL (client-side, no
 * server round trip) so the view can be shared or reloaded.
 */
export function useAnalyticsQuery(initial: AnalyticsShellProps, path: string) {
  const [query, setQueryState] = useState<AnalyticsQuery>({
    from: initial.from,
    to: initial.to,
    compare: initial.compare ?? 'previous_period',
  })

  const setQuery = useCallback(
    (next: AnalyticsQuery) => {
      setQueryState(next)
      router.replace({
        url: `${path}${analyticsQueryString(next)}`,
        preserveState: true,
        preserveScroll: true,
      })
    },
    [path]
  )

  return { query, setQuery }
}
