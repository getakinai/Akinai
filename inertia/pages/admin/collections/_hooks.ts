import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  useAdminBulkArchive,
  useAdminBulkStatus,
  useAdminCsvExport,
  useAdminCsvImport,
} from '../_hooks'
import {
  AdminCollectionProductsAddResponseSchema,
  AdminCollectionProductsResponseSchema,
  AdminCollectionResponseSchema,
  AdminCollectionsListQuerySchema,
  AdminCollectionsListResponseSchema,
  CollectionPreviewInputSchema,
  EmptyResponseSchema,
  type AdminCollectionsListQuery,
  type CollectionCreateForm,
  type CollectionPreviewInput,
  type CollectionUpdateForm,
} from './_types'

export const adminCollectionsKeys = {
  all: ['admin', 'collections'] as const,
  lists: ['admin', 'collections', 'list'] as const,
  list: (query: AdminCollectionsListQuery) => [...adminCollectionsKeys.lists, query] as const,
  detail: (id: string) => [...adminCollectionsKeys.all, 'detail', id] as const,
  products: (id: string) => [...adminCollectionsKeys.all, 'detail', id, 'products'] as const,
  preview: (input: CollectionPreviewInput) =>
    [...adminCollectionsKeys.all, 'preview', input] as const,
}

export async function fetchAdminCollections(query: AdminCollectionsListQuery) {
  const params = AdminCollectionsListQuerySchema.parse(query)
  return http(`/admin/collections/list${toQueryString(params)}`, {
    schema: AdminCollectionsListResponseSchema,
  })
}

export function useAdminCollections(query: AdminCollectionsListQuery) {
  return useQuery({
    queryKey: adminCollectionsKeys.list(query),
    queryFn: () => fetchAdminCollections(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminCollectionsInfinite(
  filters: Omit<AdminCollectionsListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList([...adminCollectionsKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminCollections({ ...filters, ...page })
  )
}

export async function fetchAdminCollection(id: string) {
  const { data } = await http(`/admin/collections/view/${id}`, {
    schema: AdminCollectionResponseSchema,
  })
  return data
}

export function useAdminCollection(id: string) {
  return useQuery({
    queryKey: adminCollectionsKeys.detail(id),
    queryFn: () => fetchAdminCollection(id),
  })
}

export async function fetchAdminCollectionProducts(
  id: string,
  page: { page: number; perPage: number }
) {
  return http(`/admin/collections/${id}/products/list${toQueryString(page)}`, {
    schema: AdminCollectionProductsResponseSchema,
  })
}

/** The collection's products, loaded in batches as the list scrolls. */
export function useAdminCollectionProductsInfinite(id: string) {
  return useAdminInfiniteList([...adminCollectionsKeys.products(id), 'infinite'], (page) =>
    fetchAdminCollectionProducts(id, page)
  )
}

export async function previewAdminCollection(input: CollectionPreviewInput) {
  return http('/admin/collections/preview', {
    method: 'POST',
    body: CollectionPreviewInputSchema.parse(input),
    schema: AdminCollectionProductsResponseSchema,
  })
}

/**
 * Products matching unsaved conditions. Pass `null` while the conditions
 * are incomplete to skip the request.
 */
export function useCollectionPreview(input: CollectionPreviewInput | null) {
  return useQuery({
    queryKey: input ? adminCollectionsKeys.preview(input) : adminCollectionsKeys.all,
    queryFn: () => previewAdminCollection(input!),
    enabled: input !== null,
    placeholderData: keepPreviousData,
  })
}

/**
 * Refreshes the collection, its products and every collection list.
 */
function useInvalidateCollection() {
  const queryClient = useQueryClient()
  return (id: string) => {
    queryClient.invalidateQueries({ queryKey: adminCollectionsKeys.detail(id) })
    queryClient.invalidateQueries({ queryKey: adminCollectionsKeys.lists })
  }
}

export async function createAdminCollection(payload: CollectionCreateForm) {
  const { data } = await http('/admin/collections', {
    method: 'POST',
    body: payload,
    schema: AdminCollectionResponseSchema,
  })
  return data
}

export function useCreateAdminCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminCollection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCollectionsKeys.lists }),
  })
}

export async function updateAdminCollection({
  id,
  ...payload
}: CollectionUpdateForm & { id: string }) {
  const { data } = await http(`/admin/collections/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminCollectionResponseSchema,
  })
  return data
}

export function useUpdateAdminCollection() {
  const invalidate = useInvalidateCollection()
  return useMutation({
    mutationFn: updateAdminCollection,
    onSuccess: (collection) => invalidate(collection.id),
  })
}

export async function archiveAdminCollection(id: string) {
  const { data } = await http(`/admin/collections/${id}/archive`, {
    method: 'POST',
    schema: AdminCollectionResponseSchema,
  })
  return data
}

export function useArchiveAdminCollection() {
  const invalidate = useInvalidateCollection()
  return useMutation({
    mutationFn: archiveAdminCollection,
    onSuccess: (collection) => invalidate(collection.id),
  })
}

export async function unarchiveAdminCollection(id: string) {
  const { data } = await http(`/admin/collections/${id}/unarchive`, {
    method: 'POST',
    schema: AdminCollectionResponseSchema,
  })
  return data
}

export function useUnarchiveAdminCollection() {
  const invalidate = useInvalidateCollection()
  return useMutation({
    mutationFn: unarchiveAdminCollection,
    onSuccess: (collection) => invalidate(collection.id),
  })
}

export async function uploadAdminCollectionImage({ id, file }: { id: string; file: File }) {
  const body = new FormData()
  body.append('image', file)
  const { data } = await http(`/admin/collections/${id}/image`, {
    method: 'POST',
    body,
    schema: AdminCollectionResponseSchema,
  })
  return data
}

export function useUploadAdminCollectionImage() {
  const invalidate = useInvalidateCollection()
  return useMutation({
    mutationFn: uploadAdminCollectionImage,
    onSuccess: (collection) => invalidate(collection.id),
  })
}

export async function removeAdminCollectionImage(id: string) {
  const { data } = await http(`/admin/collections/${id}/image`, {
    method: 'DELETE',
    schema: AdminCollectionResponseSchema,
  })
  return data
}

export function useRemoveAdminCollectionImage() {
  const invalidate = useInvalidateCollection()
  return useMutation({
    mutationFn: removeAdminCollectionImage,
    onSuccess: (collection) => invalidate(collection.id),
  })
}

export function useBulkSetAdminCollectionsStatus() {
  return useAdminBulkStatus('/admin/collections/bulk/status', adminCollectionsKeys.all)
}

export function useBulkSetAdminCollectionsArchived() {
  return useAdminBulkArchive('/admin/collections/bulk/archive', adminCollectionsKeys.all)
}

export async function addAdminCollectionProducts({
  id,
  productIds,
}: {
  id: string
  productIds: string[]
}) {
  const { data } = await http(`/admin/collections/${id}/products`, {
    method: 'POST',
    body: { productIds },
    schema: AdminCollectionProductsAddResponseSchema,
  })
  return data
}

export function useAddAdminCollectionProducts() {
  const invalidate = useInvalidateCollection()
  return useMutation({
    mutationFn: addAdminCollectionProducts,
    onSuccess: (_data, { id }) => invalidate(id),
  })
}

export async function removeAdminCollectionProduct({
  id,
  productId,
}: {
  id: string
  productId: string
}) {
  await http(`/admin/collections/${id}/products/${productId}`, {
    method: 'DELETE',
    schema: EmptyResponseSchema,
  })
}

export function useRemoveAdminCollectionProduct() {
  const invalidate = useInvalidateCollection()
  return useMutation({
    mutationFn: removeAdminCollectionProduct,
    onSuccess: (_data, { id }) => invalidate(id),
  })
}

export async function moveAdminCollectionProduct({
  id,
  productId,
  position,
}: {
  id: string
  productId: string
  position: number
}) {
  await http(`/admin/collections/${id}/products/reorder`, {
    method: 'PUT',
    body: { productId, position },
    schema: EmptyResponseSchema,
  })
}

export function useMoveAdminCollectionProduct() {
  const invalidate = useInvalidateCollection()
  return useMutation({
    mutationFn: moveAdminCollectionProduct,
    onSuccess: (_data, { id }) => invalidate(id),
  })
}

/** Downloads the collections matching the list filters as an import-ready CSV. */
export function useExportAdminCollections() {
  return useAdminCsvExport(
    '/admin/collections/export',
    'collections.csv',
    (query: Omit<AdminCollectionsListQuery, 'page' | 'perPage'>) =>
      AdminCollectionsListQuerySchema.omit({ page: true, perPage: true }).parse(query)
  )
}

export function useImportAdminCollections() {
  return useAdminCsvImport('/admin/collections/import', [adminCollectionsKeys.all])
}
