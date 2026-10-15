import { useCallback, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { FormSwitch, FormInput, FormRichtextEditor, FormSelect } from '~/components/form'
import Section from '~/components/section'
import SeoFields from '~/components/seo_fields'
import { TabPanel, Tabs } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { richtextFieldValue } from '~/lib/richtext_form'
import type { RichTextEditorHandle } from '~/components/form/rich-text/editor'
import { type FieldErrors } from '~/lib/http'
import { panel, productFormGrid } from '~/lib/styles'
import ProductActivityCard from './_activity_card'
import { FREE_SHIPPING_HINT } from './_format'
import { useUpdateAdminProduct } from './_hooks'
import MediaFields, {
  mediaPayload,
  productFormTabs,
  tabForErrors,
  type MediaValues,
  type ProductFormTab,
} from './_media_fields'
import OrganizationFields, { type OrganizationValues } from './_organization_fields'
import { ProductDetailsFormSchema, type AdminProductDetail } from './_types'

type DetailsCardProps = {
  product: AdminProductDetail
  editable: boolean
  /** The page header's Save button submits this form via `form={formId}`. */
  formId: string
  onMediaBusyChange: (busy: boolean) => void
  /** Content of the Pricing tab (variants and market prices). Stays mounted so unsaved edits survive tab switches. */
  pricing?: ReactNode
  /** Content of the Reviews tab, mounted only while it is open. */
  reviews?: ReactNode
}

type DetailsValues = {
  title: string
  description: string
  status: string
  chargeTax: boolean
  freeShipping: boolean
  seoTitle: string
  seoDescription: string
  organization: OrganizationValues
  media: MediaValues
}

function initialValues(product: AdminProductDetail): DetailsValues {
  return {
    media: { cover: product.coverImage, gallery: product.galleryImages },
    title: product.title,
    description: product.description ?? '',
    status: product.status === 'active' ? 'active' : 'draft',
    chargeTax: product.chargeTax,
    freeShipping: product.freeShipping,
    seoTitle: product.seoTitle ?? '',
    seoDescription: product.seoDescription ?? '',
    organization: {
      productTypeId: product.productTypeId ?? '',
      vendorId: product.vendorId ?? '',
      productLabelId: product.productLabelId ?? '',
      tags: product.tags,
    },
  }
}

/**
 * Two-column product layout: details form in the main column, organization
 * (saved with the details) in the side column. Fields reset whenever the
 * product changes.
 */
export default function DetailsCard({
  product,
  editable,
  formId,
  onMediaBusyChange,
  pricing,
  reviews,
}: DetailsCardProps) {
  const version = `${product.id}-${product.updatedAt ?? ''}`
  const [loadedVersion, setLoadedVersion] = useState(version)
  const [values, setValues] = useState(() => initialValues(product))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [mediaBusy, setMediaBusy] = useState(false)
  const [tab, setTab] = useState<ProductFormTab>('details')
  const descriptionEditorRef = useRef<RichTextEditorHandle>(null)
  const updateProduct = useUpdateAdminProduct()

  if (version !== loadedVersion) {
    setLoadedVersion(version)
    setValues(initialValues(product))
    setErrors({})
  }

  const {
    title,
    description,
    status,
    chargeTax,
    freeShipping,
    seoTitle,
    seoDescription,
    organization,
    media,
  } = values

  function setField<K extends keyof DetailsValues>(key: K, value: DetailsValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function showErrors(next: FieldErrors) {
    setErrors(next)
    setTab((current) => tabForErrors(next, current))
  }

  const onBusyChange = useCallback(
    (busy: boolean) => {
      setMediaBusy(busy)
      onMediaBusyChange(busy)
    },
    [onMediaBusyChange]
  )

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!editable || mediaBusy || updateProduct.isPending) return
    const descriptionHtml = richtextFieldValue(descriptionEditorRef.current, description)
    const parsed = ProductDetailsFormSchema.safeParse({
      title,
      description: emptyToNull(descriptionHtml),
      status,
      chargeTax,
      freeShipping,
      productTypeId: emptyToNull(organization.productTypeId),
      vendorId: emptyToNull(organization.vendorId),
      productLabelId: emptyToNull(organization.productLabelId),
      tags: organization.tags,
      ...mediaPayload(media),
      seoTitle: emptyToNull(seoTitle),
      seoDescription: emptyToNull(seoDescription),
    })
    if (!parsed.success) return showErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateProduct.mutate(
      { id: product.id, ...parsed.data },
      {
        onSuccess: (saved) => toast.success(`${saved.title} saved`),
        onError: (error) => handleMutationError(error, showErrors),
      }
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        idPrefix="product-edit"
        label="Product sections"
        tabs={productFormTabs(errors, media, { saved: { reviewsCount: product.reviewsCount } })}
        value={tab}
        onChange={setTab}
      />

      <form
        id={formId}
        className="flex flex-col gap-6"
        hidden={tab === 'activity' || tab === 'pricing'}
        onSubmit={onSubmit}
        noValidate
      >
        <TabPanel
          idPrefix="product-edit"
          id="details"
          active={tab === 'details'}
          className={productFormGrid}
        >
          <div className="flex min-w-0 flex-col gap-6">
            <div className={panel}>
              <Section title="Details">
                <FormInput
                  name="title"
                  label="Title"
                  autoComplete="off"
                  value={title}
                  disabled={!editable}
                  onChange={(event) => setField('title', event.target.value)}
                  error={errors.title}
                />
                <FormRichtextEditor
                  name="description"
                  label="Description"
                  value={description}
                  editorKey={version}
                  editorRef={descriptionEditorRef}
                  disabled={!editable}
                  onChange={(next) => setField('description', next)}
                  error={errors.description}
                  placeholder="Describe this product for customers…"
                  minHeight={240}
                />
                <FormSelect
                  name="status"
                  label="Status"
                  value={status}
                  disabled={!editable}
                  onChange={(event) => setField('status', event.target.value)}
                  error={errors.status}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'active', label: 'Active' },
                  ]}
                />
                <FormSwitch
                  name="chargeTax"
                  label="Charge tax on this product"
                  checked={chargeTax}
                  disabled={!editable}
                  onChange={(event) => setField('chargeTax', event.target.checked)}
                  error={errors.chargeTax}
                />
                <FormSwitch
                  name="freeShipping"
                  label="Ships free"
                  hint={FREE_SHIPPING_HINT}
                  checked={freeShipping}
                  disabled={!editable}
                  onChange={(event) => setField('freeShipping', event.target.checked)}
                  error={errors.freeShipping}
                />
              </Section>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <section className={panel}>
              <Section
                title="Organization"
                description="Group this product into collections by type, vendor and tags, and pick a store label."
              >
                <OrganizationFields
                  values={organization}
                  onChange={(next) => setField('organization', next)}
                  errors={errors}
                  disabled={!editable}
                  current={{
                    productType: product.productType,
                    vendor: product.vendor,
                    productLabel: product.productLabel,
                  }}
                />
              </Section>
            </section>
          </div>
        </TabPanel>

        <TabPanel idPrefix="product-edit" id="photos" active={tab === 'photos'}>
          <div className={panel}>
            <Section
              title="Photos"
              description="The cover photo is shown on product cards and search. Gallery photos are optional."
            >
              <MediaFields
                values={media}
                onChange={(update) =>
                  setValues((current) => ({ ...current, media: update(current.media) }))
                }
                errors={errors}
                disabled={!editable}
                onBusyChange={onBusyChange}
              />
            </Section>
          </div>
        </TabPanel>

        <TabPanel idPrefix="product-edit" id="seo" active={tab === 'seo'}>
          <div className={panel}>
            <SeoFields
              pathPrefix="/products"
              entityLabel="product"
              title={title}
              slug={product.slug}
              seoTitle={seoTitle}
              onSeoTitleChange={(next) => setField('seoTitle', next)}
              seoDescription={seoDescription}
              onSeoDescriptionChange={(next) => setField('seoDescription', next)}
              errors={errors}
              disabled={!editable}
              collapsible={false}
            />
          </div>
        </TabPanel>
      </form>

      <TabPanel
        idPrefix="product-edit"
        id="pricing"
        active={tab === 'pricing'}
        className="flex flex-col gap-6"
      >
        {pricing}
      </TabPanel>

      <TabPanel idPrefix="product-edit" id="reviews" active={tab === 'reviews'}>
        {tab === 'reviews' && reviews}
      </TabPanel>

      <TabPanel idPrefix="product-edit" id="activity" active={tab === 'activity'}>
        {tab === 'activity' && <ProductActivityCard productId={product.id} />}
      </TabPanel>
    </div>
  )
}
