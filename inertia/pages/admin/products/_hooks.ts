import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { transmitClient } from '~/lib/transmit'
import {
  ActivityListQuerySchema,
  type ActivityFilters,
  type ActivityListQuery,
} from '../_audit_types'
import {
  AdminProductActivityResponseSchema,
  AdminProductReviewResponseSchema,
  AdminProductReviewsResponseSchema,
  InventoryFormSchema,
  AdminProductFacetsResponseSchema,
  AdminProductResponseSchema,
  AdminProductsListQuerySchema,
  AdminProductsListResponseSchema,
  AdminVariantDeleteResponseSchema,
  AdminVariantResponseSchema,
  ProductImportProgressSchema,
  UploadedImageResponseSchema,
  type InventoryForm,
  type ProductImportProgress,
  type ProductCreateForm,
  type ProductDetailsForm,
  type ProductOptionForm,
  type AdminProductsListQuery,
  type VariantDetailForm,
  type VariantForm,
} from './_types'
import { storefrontKeys } from '~/pages/_hooks'
import {
  useAdminBulkArchive,
  useAdminBulkStatus,
  useAdminCsvExport,
  useAdminCsvImportWith,
  useAdminMe,
} from '../_hooks'
import { adminStorefrontKeys } from '../storefront/_hooks'

export const adminProductsKeys = {
  all: ['admin', 'products'] as const,
  lists: ['admin', 'products', 'list'] as const,
  facets: ['admin', 'products', 'facets'] as const,
  update: ['admin', 'products', 'update'] as const,
  list: (query: AdminProductsListQuery) => [...adminProductsKeys.lists, query] as const,
  detail: (id: string) => [...adminProductsKeys.all, 'detail', id] as const,
  variant: (productId: string, id: string) =>
    [...adminProductsKeys.all, 'detail', productId, 'variant', id] as const,
  reviews: (productId: string) =>
    [...adminProductsKeys.all, 'detail', productId, 'reviews'] as const,
  activity: (productId: string, filters: ActivityFilters) =>
    [...adminProductsKeys.all, 'detail', productId, 'activity', filters] as const,
}

export async function fetchAdminProductActivity(id: string, query: ActivityListQuery) {
  const params = ActivityListQuerySchema.parse(query)
  return http(`/admin/products/${id}/activity${toQueryString(params)}`, {
    schema: AdminProductActivityResponseSchema,
  })
}

/** The product's and its variants' activity, loaded in batches as the table scrolls. */
export function useAdminProductActivityInfinite(id: string, filters: ActivityFilters) {
  return useAdminInfiniteList(adminProductsKeys.activity(id, filters), (page) =>
    fetchAdminProductActivity(id, { ...filters, ...page })
  )
}

export async function fetchAdminProductReviews(
  productId: string,
  page: { page: number; perPage: number }
) {
  return http(`/admin/products/${productId}/reviews/list${toQueryString(page)}`, {
    schema: AdminProductReviewsResponseSchema,
  })
}

/** The product's reviews, loaded in batches as the list scrolls. */
export function useAdminProductReviewsInfinite(productId: string) {
  return useAdminInfiniteList([...adminProductsKeys.reviews(productId), 'infinite'], (page) =>
    fetchAdminProductReviews(productId, page)
  )
}

export async function setAdminProductReviewFlags({
  productId,
  id,
  ...flags
}: {
  productId: string
  id: string
  isHidden?: boolean
  isFeatured?: boolean
}) {
  const { data } = await http(`/admin/products/${productId}/reviews/${id}`, {
    method: 'PUT',
    body: flags,
    schema: AdminProductReviewResponseSchema,
  })
  return data
}

/**
 * Hides/shows or features/unfeatures a review. Also refreshes the featured
 * list on the Storefront content page and the home page testimonials.
 */
export function useSetAdminProductReviewFlags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setAdminProductReviewFlags,
    onSettled: (_data, _error, { productId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminProductsKeys.reviews(productId) }),
        queryClient.invalidateQueries({ queryKey: adminStorefrontKeys.featuredReviews }),
        queryClient.invalidateQueries({ queryKey: storefrontKeys.homeContent }),
      ]),
  })
}

export async function fetchAdminProducts(query: AdminProductsListQuery) {
  const params = AdminProductsListQuerySchema.parse(query)
  return http(`/admin/products/list${toQueryString(params)}`, {
    schema: AdminProductsListResponseSchema,
  })
}

export function useAdminProducts(query: AdminProductsListQuery) {
  return useQuery({
    queryKey: adminProductsKeys.list(query),
    queryFn: () => fetchAdminProducts(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminProductsInfinite(
  filters: Omit<AdminProductsListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList([...adminProductsKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminProducts({ ...filters, ...page })
  )
}

export type AdminProductsExportQuery = Omit<AdminProductsListQuery, 'page' | 'perPage'>

/** Downloads the products matching the list filters as an import-ready CSV. */
export function useExportAdminProducts() {
  return useAdminCsvExport(
    '/admin/products/export',
    'products.csv',
    (query: AdminProductsExportQuery) =>
      AdminProductsListQuerySchema.omit({ page: true, perPage: true }).parse(query)
  )
}

export async function fetchAdminProductFacets() {
  const { data } = await http('/admin/products/facets', {
    schema: AdminProductFacetsResponseSchema,
  })
  return data
}

export function useAdminProductFacets() {
  return useQuery({ queryKey: adminProductsKeys.facets, queryFn: fetchAdminProductFacets })
}

export async function fetchAdminProduct(id: string) {
  const { data } = await http(`/admin/products/view/${id}`, { schema: AdminProductResponseSchema })
  return data
}

export function useAdminProduct(id: string) {
  return useQuery({ queryKey: adminProductsKeys.detail(id), queryFn: () => fetchAdminProduct(id) })
}

/**
 * Refreshes the product's detail and every product list after a mutation.
 */
function useInvalidateProduct() {
  const queryClient = useQueryClient()
  return (productId: string) => {
    queryClient.invalidateQueries({ queryKey: adminProductsKeys.detail(productId) })
    queryClient.invalidateQueries({ queryKey: adminProductsKeys.lists })
    queryClient.invalidateQueries({ queryKey: adminProductsKeys.facets })
  }
}

export async function createAdminProduct(payload: ProductCreateForm) {
  const { data } = await http('/admin/products', {
    method: 'POST',
    body: payload,
    schema: AdminProductResponseSchema,
  })
  return data
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductsKeys.lists })
      queryClient.invalidateQueries({ queryKey: adminProductsKeys.facets })
    },
  })
}

export async function updateAdminProduct({ id, ...payload }: ProductDetailsForm & { id: string }) {
  const { data } = await http(`/admin/products/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminProductResponseSchema,
  })
  return data
}

export function useUpdateAdminProduct() {
  const invalidate = useInvalidateProduct()
  return useMutation({
    mutationKey: adminProductsKeys.update,
    mutationFn: updateAdminProduct,
    onSuccess: (product) => invalidate(product.id),
  })
}

export async function updateAdminProductOptions({
  id,
  options,
}: {
  id: string
  options: ProductOptionForm[]
}) {
  const { data } = await http(`/admin/products/${id}/options`, {
    method: 'PUT',
    body: { options },
    schema: AdminProductResponseSchema,
  })
  return data
}

export function useUpdateAdminProductOptions() {
  const invalidate = useInvalidateProduct()
  return useMutation({
    mutationFn: updateAdminProductOptions,
    onSuccess: (product) => invalidate(product.id),
  })
}

export async function uploadAdminProductImage(file: File) {
  const body = new FormData()
  body.append('image', file)
  const { data } = await http('/admin/products/images', {
    method: 'POST',
    body,
    schema: UploadedImageResponseSchema,
  })
  return data
}

export function useUploadAdminProductImage() {
  return useMutation({ mutationFn: uploadAdminProductImage })
}

/** `importId` tags the progress events for this upload. */
export function useImportAdminProducts() {
  return useAdminCsvImportWith(
    '/admin/products/import',
    [adminProductsKeys.lists, adminProductsKeys.facets],
    (input: { file: File; importId: string }) => input
  )
}

/**
 * Progress of the import tagged `importId`, from the signed-in user's
 * import channel. Subscribes while `enabled` (the dialog is open), so no
 * message is missed when the upload starts.
 */
export function useProductImportProgress(importId: string | null, enabled: boolean) {
  const me = useAdminMe()
  const userId = me.data?.id ?? null
  const [progress, setProgress] = useState<ProductImportProgress | null>(null)

  useEffect(() => {
    const transmit = enabled && userId ? transmitClient() : null
    if (!transmit) return
    const subscription = transmit.subscription(`admin/product-imports/${userId}`)
    const stop = subscription.onMessage((message: unknown) => {
      const parsed = ProductImportProgressSchema.safeParse(message)
      if (parsed.success) setProgress(parsed.data)
    })
    void subscription.create().catch((error: unknown) => {
      console.warn('Import progress is unavailable', error)
    })
    return () => {
      stop()
      void subscription.delete().catch((error: unknown) => {
        console.warn('Could not stop import progress', error)
      })
    }
  }, [enabled, userId])

  return progress && progress.importId === importId ? progress : null
}

export async function archiveAdminProduct(id: string) {
  const { data } = await http(`/admin/products/${id}/archive`, {
    method: 'POST',
    schema: AdminProductResponseSchema,
  })
  return data
}

export function useArchiveAdminProduct() {
  const invalidate = useInvalidateProduct()
  return useMutation({
    mutationFn: archiveAdminProduct,
    onSuccess: (product) => invalidate(product.id),
  })
}

export async function unarchiveAdminProduct(id: string) {
  const { data } = await http(`/admin/products/${id}/unarchive`, {
    method: 'POST',
    schema: AdminProductResponseSchema,
  })
  return data
}

export function useUnarchiveAdminProduct() {
  const invalidate = useInvalidateProduct()
  return useMutation({
    mutationFn: unarchiveAdminProduct,
    onSuccess: (product) => invalidate(product.id),
  })
}

type VariantRef = { productId: string; id: string }

const variantUrl = ({ productId, id }: VariantRef) => `/admin/products/${productId}/variants/${id}`

export async function fetchAdminVariant(ref: VariantRef) {
  const { data } = await http(`/admin/products/${ref.productId}/variants/view/${ref.id}`, {
    schema: AdminVariantResponseSchema,
  })
  return data
}

export function useAdminVariant(productId: string, id: string) {
  return useQuery({
    queryKey: adminProductsKeys.variant(productId, id),
    queryFn: () => fetchAdminVariant({ productId, id }),
  })
}

/**
 * Refreshes the parent product, its lists and the variant after a variant
 * mutation.
 */
function useInvalidateVariant() {
  const queryClient = useQueryClient()
  const invalidateProduct = useInvalidateProduct()
  return ({ productId, id }: VariantRef) => {
    invalidateProduct(productId)
    queryClient.invalidateQueries({ queryKey: adminProductsKeys.variant(productId, id) })
  }
}

export async function createAdminVariant({
  productId,
  ...payload
}: VariantDetailForm & { productId: string }) {
  const { data } = await http(`/admin/products/${productId}/variants`, {
    method: 'POST',
    body: payload,
    schema: AdminVariantResponseSchema,
  })
  return data
}

export function useCreateAdminVariant() {
  const invalidate = useInvalidateVariant()
  return useMutation({
    mutationFn: createAdminVariant,
    onSuccess: (variant) => invalidate({ productId: variant.productId, id: variant.id }),
  })
}

export async function updateAdminVariant({
  productId,
  id,
  ...payload
}: (VariantForm | VariantDetailForm) & VariantRef) {
  const { data } = await http(variantUrl({ productId, id }), {
    method: 'PUT',
    body: payload,
    schema: AdminVariantResponseSchema,
  })
  return data
}

export function useUpdateAdminVariant() {
  const invalidate = useInvalidateVariant()
  return useMutation({
    mutationFn: updateAdminVariant,
    onSuccess: (variant) => invalidate({ productId: variant.productId, id: variant.id }),
  })
}

export async function deleteAdminVariant(ref: VariantRef) {
  await http(variantUrl(ref), { method: 'DELETE', schema: AdminVariantDeleteResponseSchema })
}

export function useDeleteAdminVariant() {
  const queryClient = useQueryClient()
  const invalidateProduct = useInvalidateProduct()
  return useMutation({
    mutationFn: deleteAdminVariant,
    onSuccess: (_data, ref) => {
      queryClient.removeQueries({ queryKey: adminProductsKeys.variant(ref.productId, ref.id) })
      invalidateProduct(ref.productId)
    },
  })
}

export async function updateVariantInventory({
  productId,
  id,
  ...payload
}: InventoryForm & VariantRef) {
  const body = InventoryFormSchema.parse(payload)
  const { data } = await http(`${variantUrl({ productId, id })}/inventory`, {
    method: 'PUT',
    body,
    schema: AdminVariantResponseSchema,
  })
  return data
}

export function useUpdateVariantInventory() {
  const invalidate = useInvalidateVariant()
  return useMutation({
    mutationFn: updateVariantInventory,
    onSuccess: (variant) => invalidate({ productId: variant.productId, id: variant.id }),
  })
}

export function useBulkSetAdminProductsStatus() {
  return useAdminBulkStatus('/admin/products/bulk/status', adminProductsKeys.all)
}

export function useBulkSetAdminProductsArchived() {
  return useAdminBulkArchive('/admin/products/bulk/archive', adminProductsKeys.all)
}
