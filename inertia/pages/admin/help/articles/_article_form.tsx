import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import {
  FormButton,
  FormInput,
  FormInputNumber,
  FormMarkdownEditor,
  FormMultiSelect,
  FormSelectWithSearch,
  FormSwitch,
  FormTagsInput,
  FormTextarea,
} from '~/components/form'
import Section from '~/components/section'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { panel } from '~/lib/styles'
import { useAdminHelpCategoryOptions } from '../categories/_hooks'
import { helpArticlePreview } from './_format'
import {
  useAdminHelpArticleOptions,
  useCreateAdminHelpArticle,
  usePreviewAdminHelpMarkdown,
  useUpdateAdminHelpArticle,
} from './_hooks'
import { AdminHelpArticleFormSchema, MAX_HELP_KEYWORDS, type AdminHelpArticle } from './_types'

type ArticleFormProps = {
  article?: AdminHelpArticle
  editable?: boolean
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
]

const MARKDOWN_TIPS = (
  <>
    <code>## Heading</code>, <code>**bold**</code>, <code>- list item</code>, <code>1. step</code>,{' '}
    <code>[link](/account/orders)</code> and <code>| tables |</code>. Images and raw HTML are
    removed. The help chat quotes paragraphs and list items from this text.
  </>
)

/**
 * Create and edit form. Without `article` it creates; with one it updates.
 * Remount with a new `key` after the article changes to reset the fields.
 */
export default function ArticleForm({ article, editable = true }: ArticleFormProps) {
  const isEdit = article !== undefined
  const [title, setTitle] = useState(article?.title ?? '')
  const [slug, setSlug] = useState(article?.slug ?? '')
  const [description, setDescription] = useState(article?.description ?? '')
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? '')
  const [groupId, setGroupId] = useState(article?.groupId ?? '')
  const [keywords, setKeywords] = useState<string[]>(article?.keywords ?? [])
  const [bodyMarkdown, setBodyMarkdown] = useState(article?.bodyMarkdown ?? '')
  const [popular, setPopular] = useState(article?.popular ?? false)
  const [position, setPosition] = useState<number | null>(article?.position ?? 0)
  const [ctaLabel, setCtaLabel] = useState(article?.ctaLabel ?? '')
  const [ctaHref, setCtaHref] = useState(article?.ctaHref ?? '')
  const [status, setStatus] = useState<'draft' | 'active'>(
    article?.status === 'active' ? 'active' : 'draft'
  )
  const [relatedIds, setRelatedIds] = useState<string[]>(article?.relatedIds ?? [])
  const [errors, setErrors] = useState<FieldErrors>({})

  const categories = useAdminHelpCategoryOptions()
  const articles = useAdminHelpArticleOptions()
  const preview = usePreviewAdminHelpMarkdown()
  const createArticle = useCreateAdminHelpArticle()
  const updateArticle = useUpdateAdminHelpArticle()
  const runPreview = preview.mutate
  const onPreview = useCallback((markdown: string) => runPreview(markdown), [runPreview])

  const categoryOptions = useMemo(() => {
    const options = (categories.data ?? []).map((category) => ({
      value: category.id,
      label: category.title,
    }))
    if (article?.category && !options.some((option) => option.value === article.categoryId)) {
      options.push({ value: article.categoryId, label: `${article.category.title} (archived)` })
    }
    return options
  }, [categories.data, article])

  const groupOptions = useMemo(() => {
    const category = categories.data?.find((item) => item.id === categoryId)
    return [
      { value: '', label: 'No section' },
      ...(category?.groups ?? []).map((group) => ({ value: group.id, label: group.title })),
    ]
  }, [categories.data, categoryId])

  const relatedOptions = useMemo(
    () =>
      (articles.data ?? [])
        .filter((option) => option.id !== article?.id)
        .map((option) => ({
          value: option.id,
          label: option.title,
          subtitle: `/${option.slug}`,
          badge: option.status === 'draft' ? { label: 'Draft' } : undefined,
        })),
    [articles.data, article?.id]
  )

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminHelpArticleFormSchema.safeParse({
      title,
      slug: emptyToNull(slug),
      description,
      categoryId,
      groupId: emptyToNull(groupId),
      keywords,
      bodyMarkdown,
      popular,
      position,
      ctaLabel: emptyToNull(ctaLabel),
      ctaHref: emptyToNull(ctaHref),
      status,
      relatedIds,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
    setErrors({})

    if (article) {
      updateArticle.mutate(
        { id: article.id, ...parsed.data },
        {
          onSuccess: (saved) => toast.success(`${saved.title} saved`),
          onError: (error) => handleMutationError(error, setErrors),
        }
      )
      return
    }

    createArticle.mutate(parsed.data, {
      onSuccess: (saved) => {
        toast.success(`${saved.title} created`)
        router.visit(`/admin/help/articles/edit/${saved.id}`)
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form className={panel} onSubmit={onSubmit} noValidate>
      <Section title="Content">
        <FormInput
          name="title"
          label="Title"
          placeholder="Track your order"
          autoComplete="off"
          value={title}
          disabled={!editable}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
          autoFocus={!isEdit}
        />
        <FormTextarea
          name="description"
          label="Summary"
          rows={2}
          value={description}
          disabled={!editable}
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description}
        />
        <FormMarkdownEditor
          name="bodyMarkdown"
          label="Article"
          value={bodyMarkdown}
          disabled={!editable}
          onChange={setBodyMarkdown}
          onPreview={onPreview}
          preview={{
            html: preview.data,
            isLoading: preview.isPending,
            isError: preview.isError,
          }}
          error={errors.bodyMarkdown}
          placeholder={'Start with a short answer.\n\n## How to …\n\n1. First step\n2. Next step'}
          tooltip={MARKDOWN_TIPS}
          previewClassName={helpArticlePreview}
        />
      </Section>

      <Section title="Placement">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectWithSearch
            name="categoryId"
            label="Category"
            value={categoryId}
            disabled={!editable}
            isLoading={categories.isLoading}
            placeholder="Pick a category"
            onChange={(next) => {
              setCategoryId(next)
              setGroupId('')
            }}
            error={errors.categoryId}
            options={categoryOptions}
          />
          <FormSelectWithSearch
            name="groupId"
            label="Section"
            value={groupId}
            disabled={!editable || !categoryId}
            onChange={setGroupId}
            error={errors.groupId}
            options={groupOptions}
          />
          <FormSelectWithSearch
            name="status"
            label="Status"
            value={status}
            disabled={!editable}
            onChange={(next) => setStatus(next === 'active' ? 'active' : 'draft')}
            error={errors.status}
            options={STATUS_OPTIONS}
            tooltip="Only active articles show on the storefront and in the help chat."
          />
          <FormInputNumber
            name="position"
            label="Order"
            min={0}
            max={1000}
            step={1}
            value={position}
            disabled={!editable}
            onChange={setPosition}
            error={errors.position}
          />
        </div>
        <FormSwitch
          name="popular"
          label="Popular article"
          checked={popular}
          disabled={!editable}
          onChange={(event) => setPopular(event.target.checked)}
          error={errors.popular}
          tooltip="Popular articles are listed on the help center home and suggested when someone greets the help chat."
        />
      </Section>

      <Section title="Search and links">
        <FormTagsInput
          name="keywords"
          label="Search keywords"
          values={keywords}
          onChange={(next) => setKeywords(next.slice(0, MAX_HELP_KEYWORDS))}
          disabled={!editable}
          error={errors.keywords}
          placeholder="Add a word customers might type and press Enter"
          maxLength={60}
        />
        <FormMultiSelect
          name="relatedIds"
          label="Related articles"
          options={relatedOptions}
          values={relatedIds}
          onChange={setRelatedIds}
          disabled={!editable}
          error={errors.relatedIds}
          placeholder="Add an article…"
          emptyText="No related articles."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            name="ctaLabel"
            label="Button text"
            placeholder="Go to my orders"
            autoComplete="off"
            value={ctaLabel}
            disabled={!editable}
            onChange={(event) => setCtaLabel(event.target.value)}
            error={errors.ctaLabel}
            tooltip="Optional button shown under the article. Fill in both fields or leave both empty."
          />
          <FormInput
            name="ctaHref"
            label="Button link"
            placeholder="/account/orders"
            autoComplete="off"
            value={ctaHref}
            disabled={!editable}
            onChange={(event) => setCtaHref(event.target.value)}
            error={errors.ctaHref}
          />
        </div>
        <FormInput
          name="slug"
          label="URL handle"
          placeholder={isEdit ? undefined : 'Generated from the title'}
          autoComplete="off"
          value={slug}
          disabled={!editable}
          onChange={(event) => setSlug(event.target.value)}
          error={errors.slug}
          tooltip="The article lives at /help/<category>/<handle>. Changing it breaks links people saved."
        />
      </Section>

      {editable && (
        <div className="mt-7 flex flex-wrap justify-end gap-2.5">
          {!isEdit && (
            <FormButton
              type="button"
              variant="secondary"
              onClick={() => router.visit('/admin/help/articles')}
            >
              Cancel
            </FormButton>
          )}
          <FormButton loading={createArticle.isPending || updateArticle.isPending}>
            {isEdit ? 'Save article' : 'Create article'}
          </FormButton>
        </div>
      )}
    </form>
  )
}
