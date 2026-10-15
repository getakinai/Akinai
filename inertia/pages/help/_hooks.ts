import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { http, HttpError } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  HelpArticleResponseSchema,
  HelpCategoryResponseSchema,
  HelpCenterHomeResponseSchema,
  HelpSearchResponseSchema,
} from './_types'

/** Shorter queries are not sent; they match too much to be useful. */
export const HELP_SEARCH_MIN_LENGTH = 2

export const helpKeys = {
  all: ['store', 'help'] as const,
  home: ['store', 'help', 'home'] as const,
  category: (slug: string) => ['store', 'help', 'categories', slug] as const,
  article: (category: string, slug: string) =>
    ['store', 'help', 'articles', category, slug] as const,
  search: (q: string) => ['store', 'help', 'search', q] as const,
}

const notRetriedOn404 = (failureCount: number, error: Error) =>
  !(error instanceof HttpError && error.status === 404) && failureCount < 2

export async function fetchHelpCenterHome() {
  const { data } = await http('/store/help/categories', { schema: HelpCenterHomeResponseSchema })
  return data
}

/** Help categories with a few articles each, plus the popular articles. */
export function useHelpCenterHome() {
  return useQuery({
    queryKey: helpKeys.home,
    queryFn: fetchHelpCenterHome,
    staleTime: 5 * 60 * 1000,
  })
}

export async function fetchHelpCategory(slug: string) {
  const { data } = await http(`/store/help/categories/view/${encodeURIComponent(slug)}`, {
    schema: HelpCategoryResponseSchema,
  })
  return data
}

/** A help category with its articles grouped into sections. A 404 is not retried. */
export function useHelpCategory(slug: string) {
  return useQuery({
    queryKey: helpKeys.category(slug),
    queryFn: () => fetchHelpCategory(slug),
    staleTime: 5 * 60 * 1000,
    retry: notRetriedOn404,
  })
}

export async function fetchHelpArticle(category: string, slug: string) {
  const { data } = await http(
    `/store/help/articles/view/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`,
    { schema: HelpArticleResponseSchema }
  )
  return data
}

/** A help article with its related, previous and next articles. A 404 is not retried. */
export function useHelpArticle(category: string, slug: string) {
  return useQuery({
    queryKey: helpKeys.article(category, slug),
    queryFn: () => fetchHelpArticle(category, slug),
    staleTime: 5 * 60 * 1000,
    retry: notRetriedOn404,
  })
}

export async function fetchHelpSearch(q: string) {
  const { data } = await http(`/store/help/search${toQueryString({ q })}`, {
    schema: HelpSearchResponseSchema,
  })
  return data
}

/**
 * Help articles matching `q`, best match first. Idle until `q` has
 * HELP_SEARCH_MIN_LENGTH characters; keeps the previous results visible
 * while the next query loads.
 */
export function useHelpSearch(q: string) {
  const query = q.trim()
  return useQuery({
    queryKey: helpKeys.search(query),
    queryFn: () => fetchHelpSearch(query),
    enabled: query.length >= HELP_SEARCH_MIN_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}
