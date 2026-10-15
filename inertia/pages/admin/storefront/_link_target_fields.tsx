import { useMemo } from 'react'
import { FormInput, FormSelectWithSearch, type FormSelectWithSearchOption } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { MENU_ITEM_TYPE_LABELS, MENU_ITEM_TYPES, type MenuItemType } from '~/lib/storefront'
import { useAdminStorefrontCollectionOptions, useAdminStorefrontPageOptions } from './_hooks'

const TYPE_OPTIONS = MENU_ITEM_TYPES.map((value) => ({
  value,
  label: MENU_ITEM_TYPE_LABELS[value],
}))

const DRAFT_BADGE = { label: 'Draft', tone: 'neutral' as const }

type LinkTargetFieldsProps = {
  /** Prefix for the field names, e.g. `menuItem`. */
  name: string
  open: boolean
  type: MenuItemType
  onTypeChange: (type: MenuItemType) => void
  collectionId: string
  onCollectionChange: (id: string) => void
  pageId: string
  onPageChange: (id: string) => void
  url: string
  onUrlChange: (url: string) => void
  errors: FieldErrors
  /** Called with the picked and previous target titles, to prefill a label. */
  onTargetTitleChange?: (next: string | undefined, previous: string | undefined) => void
  /** What happens while the linked record is a draft, e.g. "Slides … stay hidden". */
  draftHint: { collection: string; page: string }
}

/**
 * "Links to" picker shared by menu items, hero slides and promo banners: a
 * collection, a content page or a custom URL.
 */
export default function LinkTargetFields({
  name,
  open,
  type,
  onTypeChange,
  collectionId,
  onCollectionChange,
  pageId,
  onPageChange,
  url,
  onUrlChange,
  errors,
  onTargetTitleChange,
  draftHint,
}: LinkTargetFieldsProps) {
  const collections = useAdminStorefrontCollectionOptions(open && type === 'collection')
  const pages = useAdminStorefrontPageOptions(open && type === 'page')

  const collectionOptions = useMemo<FormSelectWithSearchOption[]>(
    () =>
      (collections.data ?? []).map((collection) => ({
        value: collection.id,
        label: collection.title,
        badge: collection.status === 'draft' ? DRAFT_BADGE : undefined,
      })),
    [collections.data]
  )

  const pageOptions = useMemo<FormSelectWithSearchOption[]>(
    () =>
      (pages.data ?? []).map((page) => ({
        value: page.id,
        label: page.title,
        subtitle: `/pages/${page.slug}`,
        badge: page.status === 'draft' ? DRAFT_BADGE : undefined,
      })),
    [pages.data]
  )

  function pickCollection(id: string) {
    const titleOf = (value: string) => collections.data?.find((item) => item.id === value)?.title
    onTargetTitleChange?.(titleOf(id), titleOf(collectionId))
    onCollectionChange(id)
  }

  function pickPage(id: string) {
    const titleOf = (value: string) => pages.data?.find((item) => item.id === value)?.title
    onTargetTitleChange?.(titleOf(id), titleOf(pageId))
    onPageChange(id)
  }

  return (
    <>
      <FormSelectWithSearch
        name={`${name}Type`}
        label="Links to"
        options={TYPE_OPTIONS}
        value={type}
        onChange={(next) => {
          const match = MENU_ITEM_TYPES.find((value) => value === next)
          if (match) onTypeChange(match)
        }}
        error={errors.type}
      />

      {type === 'collection' && (
        <FormSelectWithSearch
          name={`${name}Collection`}
          label="Collection"
          placeholder="Choose a collection"
          searchPlaceholder="Search collections"
          noOptionsText="No collections yet"
          tooltip={draftHint.collection}
          options={collectionOptions}
          isLoading={collections.isLoading}
          value={collectionId}
          onChange={pickCollection}
          error={errors.collectionId}
        />
      )}

      {type === 'page' && (
        <FormSelectWithSearch
          name={`${name}Page`}
          label="Page"
          placeholder="Choose a page"
          searchPlaceholder="Search pages"
          noOptionsText="No pages yet"
          tooltip={draftHint.page}
          options={pageOptions}
          isLoading={pages.isLoading}
          value={pageId}
          onChange={pickPage}
          error={errors.pageId}
        />
      )}

      {type === 'url' && (
        <FormInput
          name={`${name}Url`}
          label="Link"
          placeholder="/sale or https://example.com"
          autoComplete="off"
          tooltip="Start with / for a page on this store. Other sites open in a new tab."
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          error={errors.url}
        />
      )}
    </>
  )
}
