import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { downloadFile, http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  AnalyticsCatalogResponseSchema,
  AnalyticsDashboardResponseSchema,
  AnalyticsLiveResponseSchema,
  AnalyticsReportResponseSchema,
  type AnalyticsExportFormat,
  type AnalyticsQuery,
} from './_types'

export const analyticsKeys = {
  all: ['admin', 'analytics'] as const,
  dashboard: (query: AnalyticsQuery) => ['admin', 'analytics', 'dashboard', query] as const,
  catalog: ['admin', 'analytics', 'catalog'] as const,
  report: (key: string, query: AnalyticsQuery) =>
    ['admin', 'analytics', 'report', key, query] as const,
  live: ['admin', 'analytics', 'live'] as const,
}

export function analyticsQueryString(query: AnalyticsQuery) {
  return toQueryString({ from: query.from, to: query.to, compare: query.compare })
}

export async function fetchAdminAnalyticsDashboard(query: AnalyticsQuery) {
  const { data } = await http(`/admin/analytics/view${analyticsQueryString(query)}`, {
    schema: AnalyticsDashboardResponseSchema,
  })
  return data
}

/** Refreshes every minute so the dashboard stays close to live. */
export function useAdminAnalyticsDashboard(query: AnalyticsQuery) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(query),
    queryFn: () => fetchAdminAnalyticsDashboard(query),
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  })
}

export async function fetchAdminAnalyticsCatalog() {
  const { data } = await http('/admin/analytics/reports/list', {
    schema: AnalyticsCatalogResponseSchema,
  })
  return data
}

export function useAdminAnalyticsCatalog() {
  return useQuery({
    queryKey: analyticsKeys.catalog,
    queryFn: fetchAdminAnalyticsCatalog,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export async function fetchAdminAnalyticsReport(key: string, query: AnalyticsQuery) {
  const { data } = await http(
    `/admin/analytics/reports/${encodeURIComponent(key)}/view${analyticsQueryString(query)}`,
    { schema: AnalyticsReportResponseSchema }
  )
  return data
}

export function useAdminAnalyticsReport(key: string, query: AnalyticsQuery) {
  return useQuery({
    queryKey: analyticsKeys.report(key, query),
    queryFn: () => fetchAdminAnalyticsReport(key, query),
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  })
}

/** Downloads a report as CSV or PDF for the selected range and comparison. */
export function useExportAdminAnalyticsReport(key: string) {
  return useMutation({
    mutationFn: ({ query, format }: { query: AnalyticsQuery; format: AnalyticsExportFormat }) =>
      downloadFile(
        `/admin/analytics/reports/${encodeURIComponent(key)}/export${toQueryString({
          from: query.from,
          to: query.to,
          compare: query.compare,
          format,
        })}`,
        `${key}.${format}`
      ),
  })
}

export async function fetchAdminAnalyticsLive() {
  const { data } = await http('/admin/analytics/live/view', {
    schema: AnalyticsLiveResponseSchema,
  })
  return data
}

/** Polls every 15 seconds while Live View is open. */
export function useAdminAnalyticsLive() {
  return useQuery({
    queryKey: analyticsKeys.live,
    queryFn: fetchAdminAnalyticsLive,
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
  })
}
