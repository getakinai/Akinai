import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { DashboardOverviewResponseSchema, type DashboardRange } from './_types'

export const dashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  overview: (range: DashboardRange) => ['admin', 'dashboard', range] as const,
}

export async function fetchAdminDashboard(range: DashboardRange) {
  const { data } = await http(`/admin/dashboard/view?range=${range}`, {
    schema: DashboardOverviewResponseSchema,
  })
  return data
}

export function useAdminDashboard(range: DashboardRange, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.overview(range),
    queryFn: () => fetchAdminDashboard(range),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled,
  })
}
