import { useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { FormButton, FormInput, FormRichtextEditor, FormSelect } from '~/components/form'
import type { RichTextEditorHandle } from '~/components/form/rich-text/editor'
import Section from '~/components/section'
import SeoFields from '~/components/seo_fields'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { richtextFieldValue } from '~/lib/richtext_form'
import { panel } from '~/lib/styles'
import { collectionTypeMeta, sortOrderLabels } from './_format'
import { useCreateAdminCollection, useUpdateAdminCollection } from './_hooks'
import RulesEditor, { newRuleDraft, toRuleForms, type RuleDraft } from './_rules_editor'
import {
  COLLECTION_SORT_ORDERS,
  CollectionCreateFormSchema,
  CollectionSortOrderSchema,
  CollectionTypeSchema,
  CollectionUpdateFormSchema,
  type AdminCollection,
  type CollectionMatch,
  type CollectionSortOrder,
  type CollectionType,
} from './_types'

type CollectionFormProps = {
  collection?: AdminCollection
  editable?: boolean
}

const DEFAULT_SORT: Record<CollectionType, CollectionSortOrder> = {
  automated: 'best_selling',
  manual: 'manual',
}

function initialRules(collection?: AdminCollection): RuleDraft[] {
  if (!collection || collection.rules.length === 0) return [newRuleDraft()]
  return collection.rules.map((rule) => newRuleDraft(rule.field, rule.operator, rule.value ?? ''))
}

/**
 * Create and edit form. Without `collection` it creates; with one it
 * updates (the type is fixed after creation). Remount with a new `key`
 * after the collection changes to reset the fields.
 */
export default function CollectionForm({ collection, editable = true }: CollectionFormProps) {
  const isEdit = collection !== undefined
  const [title, setTitle] = useState(collection?.title ?? '')
  const [description, setDescription] = useState(collection?.description ?? '')
  const [status, setStatus] = useState(collection?.status === 'active' ? 'active' : 'draft')
  const [type, setType] = useState<CollectionType>(collection?.type ?? 'automated')
  const [match, setMatch] = useState<CollectionMatch>(collection?.match ?? 'all')
  const [sortOrder, setSortOrder] = useState<CollectionSortOrder>(
    collection?.sortOrder ?? DEFAULT_SORT.automated
  )
  const [rules, setRules] = useState<RuleDraft[]>(() => initialRules(collection))
  const [slug, setSlug] = useState(collection?.slug ?? '')
  const [seoTitle, setSeoTitle] = useState(collection?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(collection?.seoDescription ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const descriptionEditorRef = useRef<RichTextEditorHandle>(null)
  const createCollection = useCreateAdminCollection()
  const updateCollection = useUpdateAdminCollection()

  const isAutomated = type === 'automated'
  const sortOptions = COLLECTION_SORT_ORDERS.filter(
    (option) => option !== 'manual' || !isAutomated
  ).map((value) => ({ value, label: sortOrderLabels[value] }))

  function changeType(next: CollectionType) {
    setType(next)
    setSortOrder(DEFAULT_SORT[next])
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const descriptionHtml = richtextFieldValue(descriptionEditorRef.current, description)
    const values = {
      type,
      title,
      description: emptyToNull(descriptionHtml),
      status,
      match,
      sortOrder,
      slug: emptyToNull(slug),
      seoTitle: emptyToNull(seoTitle),
      seoDescription: emptyToNull(seoDescription),
      rules: isAutomated ? toRuleForms(rules) : [],
    }

    if (collection) {
      const parsed = CollectionUpdateFormSchema.safeParse(values)
      if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
      setErrors({})
      updateCollection.mutate(
        { id: collection.id, ...parsed.data },
        {
          onSuccess: (saved) => toast.success(`${saved.title} saved`),
          onError: (error) => handleMutationError(error, setErrors),
        }
      )
      return
    }

    const parsed = CollectionCreateFormSchema.safeParse(values)
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
    setErrors({})
    createCollection.mutate(parsed.data, {
      onSuccess: (saved) => {
        toast.success(`${saved.title} created`)
        router.visit(`/admin/collections/edit/${saved.id}`)
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form className={panel} onSubmit={onSubmit} noValidate>
      <Section title="Details">
        <FormInput
          name="title"
          label="Title"
          placeholder="Gifts under 1,000"
          autoComplete="off"
          value={title}
          disabled={!editable}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
          autoFocus={!isEdit}
        />
        <FormRichtextEditor
          name="description"
          label="Description"
          value={description}
          editorKey={collection?.id ?? 'new'}
          editorRef={descriptionEditorRef}
          disabled={!editable}
          onChange={setDescription}
          error={errors.description}
          placeholder="Tell shoppers what this collection is about and who it's for…"
          minHeight={160}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            name="status"
            label="Status"
            value={status}
            disabled={!editable}
            onChange={(event) => setStatus(event.target.value)}
            error={errors.status}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'active', label: 'Active' },
            ]}
          />
          <FormSelect
            name="sortOrder"
            label="Sort products by"
            value={sortOrder}
            disabled={!editable}
            onChange={(event) => setSortOrder(CollectionSortOrderSchema.parse(event.target.value))}
            error={errors.sortOrder}
            options={sortOptions}
          />
        </div>
      </Section>

      <Section
        title="Collection type"
        description={
          isEdit
            ? 'The type is set when the collection is created and cannot be changed.'
            : collectionTypeMeta[type].description
        }
      >
        <div className="sm:max-w-[280px]">
          <FormSelect
            name="type"
            label="Type"
            value={type}
            disabled={isEdit || !editable}
            onChange={(event) => changeType(CollectionTypeSchema.parse(event.target.value))}
            error={errors.type}
            options={[
              { value: 'automated', label: collectionTypeMeta.automated.label },
              { value: 'manual', label: collectionTypeMeta.manual.label },
            ]}
          />
        </div>
      </Section>

      {isAutomated && (
        <Section
          title="Conditions"
          description="Use “is not equal to” or “does not contain” to exclude products, e.g. tag is not equal to exclude-from-sale."
        >
          <RulesEditor
            match={match}
            onMatchChange={setMatch}
            rules={rules}
            onRulesChange={setRules}
            sortOrder={sortOrder}
            errors={errors}
            disabled={!editable}
          />
        </Section>
      )}

      <SeoFields
        pathPrefix="/collections"
        entityLabel="collection"
        title={title}
        slug={slug}
        onSlugChange={setSlug}
        seoTitle={seoTitle}
        onSeoTitleChange={setSeoTitle}
        seoDescription={seoDescription}
        onSeoDescriptionChange={setSeoDescription}
        errors={errors}
        disabled={!editable}
        slugPlaceholder={isEdit ? undefined : 'Generated from the title'}
      />

      {editable && (
        <div className="mt-7 flex flex-wrap justify-end gap-2.5">
          {!isEdit && (
            <FormButton
              type="button"
              variant="secondary"
              onClick={() => router.visit('/admin/collections')}
            >
              Cancel
            </FormButton>
          )}
          <FormButton loading={createCollection.isPending || updateCollection.isPending}>
            {isEdit ? 'Save collection' : 'Create collection'}
          </FormButton>
        </div>
      )}
    </form>
  )
}
