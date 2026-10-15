import { useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { FormButton, FormInput, FormRichtextEditor, FormSelectWithSearch } from '~/components/form'
import type { RichTextEditorHandle } from '~/components/form/rich-text/editor'
import Section from '~/components/section'
import SeoFields from '~/components/seo_fields'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { richtextFieldValue } from '~/lib/richtext_form'
import { panel } from '~/lib/styles'
import { policyLabels } from './_format'
import { useCreateAdminPage, useUpdateAdminPage } from './_hooks'
import {
  POLICY_TYPES,
  PageFormSchema,
  PolicyTypeSchema,
  type AdminContentPage,
  type PolicyType,
} from './_types'

type PageFormProps = {
  page?: AdminContentPage
  editable?: boolean
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
]

const POLICY_OPTIONS = [
  { value: '', label: 'Not a policy' },
  ...POLICY_TYPES.map((value) => ({ value, label: policyLabels[value] })),
]

/**
 * Create and edit form. Without `page` it creates; with one it updates.
 * Remount with a new `key` after the page changes to reset the fields.
 */
export default function PageForm({ page, editable = true }: PageFormProps) {
  const isEdit = page !== undefined
  const [title, setTitle] = useState(page?.title ?? '')
  const [body, setBody] = useState(page?.body ?? '')
  const [status, setStatus] = useState<'draft' | 'active'>(
    page?.status === 'active' ? 'active' : 'draft'
  )
  const [policyType, setPolicyType] = useState<PolicyType | null>(page?.policyType ?? null)
  const [slug, setSlug] = useState(page?.slug ?? '')
  const [seoTitle, setSeoTitle] = useState(page?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(page?.seoDescription ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const bodyEditorRef = useRef<RichTextEditorHandle>(null)
  const createPage = useCreateAdminPage()
  const updatePage = useUpdateAdminPage()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = PageFormSchema.safeParse({
      title,
      body: emptyToNull(richtextFieldValue(bodyEditorRef.current, body)),
      status,
      slug: emptyToNull(slug),
      seoTitle: emptyToNull(seoTitle),
      seoDescription: emptyToNull(seoDescription),
      policyType,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
    setErrors({})

    if (page) {
      updatePage.mutate(
        { id: page.id, ...parsed.data },
        {
          onSuccess: (saved) => toast.success(`${saved.title} saved`),
          onError: (error) => handleMutationError(error, setErrors),
        }
      )
      return
    }

    createPage.mutate(parsed.data, {
      onSuccess: (saved) => {
        toast.success(`${saved.title} created`)
        router.visit(`/admin/pages/edit/${saved.id}`)
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
          placeholder="About us"
          autoComplete="off"
          value={title}
          disabled={!editable}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
          autoFocus={!isEdit}
        />
        <FormRichtextEditor
          name="body"
          label="Content"
          value={body}
          editorKey={page?.id ?? 'new'}
          editorRef={bodyEditorRef}
          disabled={!editable}
          onChange={setBody}
          error={errors.body}
          placeholder="Write the page content…"
          minHeight={320}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectWithSearch
            name="status"
            label="Status"
            value={status}
            disabled={!editable}
            onChange={(next) => setStatus(next === 'active' ? 'active' : 'draft')}
            error={errors.status}
            options={STATUS_OPTIONS}
          />
          <FormSelectWithSearch
            name="policyType"
            label="Use as store policy"
            value={policyType ?? ''}
            disabled={!editable}
            onChange={(next) => setPolicyType(next ? PolicyTypeSchema.parse(next) : null)}
            error={errors.policyType}
            options={POLICY_OPTIONS}
          />
        </div>
        <p className="text-[12.5px] text-muted">
          Active policy pages are linked in the storefront and checkout footers. Choosing a policy
          another page already uses moves it to this page.
        </p>
      </Section>

      <SeoFields
        pathPrefix="/pages"
        entityLabel="page"
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
              onClick={() => router.visit('/admin/pages')}
            >
              Cancel
            </FormButton>
          )}
          <FormButton loading={createPage.isPending || updatePage.isPending}>
            {isEdit ? 'Save page' : 'Create page'}
          </FormButton>
        </div>
      )}
    </form>
  )
}
