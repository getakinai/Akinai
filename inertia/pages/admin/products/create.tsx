import { useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import Section from '~/components/section'
import SeoFields from '~/components/seo_fields'
import { TabPanel, Tabs } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import {
  FormButton,
  FormSwitch,
  FormInput,
  FormInputNumber,
  FormRichtextEditor,
  FormSelect,
} from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { panel, productFormGrid } from '~/lib/styles'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { richtextFieldValue } from '~/lib/richtext_form'
import type { RichTextEditorHandle } from '~/components/form/rich-text/editor'
import { useWeightUnit } from '~/pages/_hooks'
import { buildCombinationsFromCatalog } from './_combinations'
import { FREE_SHIPPING_HINT } from './_format'
import { usePricingMarkets, usePrimaryPricingMarket } from '../_hooks'
import { useAdminOptionsCatalog } from '../options/_hooks'
import { useCreateAdminProduct } from './_hooks'
import MarketPriceFields from './_market_price_fields'
import {
  marketPriceEntries,
  PRODUCT_PRICING_MARKETS_URL,
  type MarketPriceDraft,
} from './_market_prices'
import MediaFields, {
  emptyMedia,
  mediaPayload,
  productFormTabs,
  tabForErrors,
  type MediaValues,
  type ProductFormTab,
} from './_media_fields'
import OptionsPicker, { fromOptionPickerDrafts, type OptionPickerDraft } from './_options_picker'
import { optionsError } from './_options_editor'
import OrganizationFields, { type OrganizationValues } from './_organization_fields'
import { ProductCreateFormSchema } from './_types'

export default function AdminProductsCreate() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('draft')
  const [price, setPrice] = useState<number | null>(null)
  const [compareAtPrice, setCompareAtPrice] = useState<number | null>(null)
  const [weight, setWeight] = useState<number | null>(null)
  const weightUnit = useWeightUnit()
  const { data: markets = [] } = usePricingMarkets(PRODUCT_PRICING_MARKETS_URL)
  const { data: primaryMarket } = usePrimaryPricingMarket(PRODUCT_PRICING_MARKETS_URL)
  const [marketPrices, setMarketPrices] = useState<MarketPriceDraft>({})
  const [chargeTax, setChargeTax] = useState(true)
  const [freeShipping, setFreeShipping] = useState(false)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [organization, setOrganization] = useState<OrganizationValues>({
    productTypeId: '',
    vendorId: '',
    productLabelId: '',
    tags: [],
  })
  const [drafts, setDrafts] = useState<OptionPickerDraft[]>([])
  const [media, setMedia] = useState<MediaValues>(emptyMedia)
  const [mediaBusy, setMediaBusy] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [tab, setTab] = useState<ProductFormTab>('details')
  const descriptionEditorRef = useRef<RichTextEditorHandle>(null)
  const createProduct = useCreateAdminProduct()
  const { data: catalog = [] } = useAdminOptionsCatalog()

  const combinations = buildCombinationsFromCatalog(fromOptionPickerDrafts(drafts), catalog)

  function showErrors(next: FieldErrors) {
    setErrors(next)
    setTab((current) => tabForErrors(next, current))
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const descriptionHtml = richtextFieldValue(descriptionEditorRef.current, description)
    const parsed = ProductCreateFormSchema.safeParse({
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
      price,
      compareAtPrice,
      weight,
      marketPrices: markets.length > 0 ? marketPriceEntries(markets, marketPrices) : undefined,
      options: fromOptionPickerDrafts(drafts),
    })
    if (!parsed.success) return showErrors(zodFieldErrors(parsed.error))

    setErrors({})
    createProduct.mutate(parsed.data, {
      onSuccess: (product) => {
        toast.success(`${product.title} created`)
        router.visit(`/admin/products/edit/${product.id}`)
      },
      onError: (error) => handleMutationError(error, showErrors),
    })
  }

  return (
    <Page
      eyebrow={
        <Link route="admin.products.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Products
        </Link>
      }
      title="Add product"
      description="Create the catalog entry first. You can set SKUs and stock per variant next."
    >
      <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
        <Tabs
          idPrefix="product-create"
          label="Product sections"
          tabs={productFormTabs(errors, media)}
          value={tab}
          onChange={setTab}
        />

        <TabPanel idPrefix="product-create" id="photos" active={tab === 'photos'}>
          <div className={panel}>
            <Section
              title="Photos"
              description="The cover photo is shown on product cards and search. Gallery photos are optional."
            >
              <MediaFields
                values={media}
                onChange={setMedia}
                errors={errors}
                onBusyChange={setMediaBusy}
              />
            </Section>
          </div>
        </TabPanel>

        <TabPanel
          idPrefix="product-create"
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
                  placeholder="Classic T-Shirt"
                  autoComplete="off"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  error={errors.title}
                  autoFocus
                />
                <FormRichtextEditor
                  name="description"
                  label="Description"
                  value={description}
                  editorRef={descriptionEditorRef}
                  onChange={setDescription}
                  error={errors.description}
                  placeholder="Describe this product for customers…"
                  minHeight={240}
                />
                <FormSelect
                  name="status"
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  error={errors.status}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'active', label: 'Active' },
                  ]}
                />
                <MarketPriceFields
                  primaryMarket={primaryMarket}
                  markets={markets}
                  price={price}
                  onPriceChange={setPrice}
                  compareAtPrice={compareAtPrice}
                  onCompareAtPriceChange={setCompareAtPrice}
                  marketPrices={marketPrices}
                  onMarketPricesChange={setMarketPrices}
                  errors={errors}
                />
                <FormSwitch
                  name="chargeTax"
                  label="Charge tax on this product"
                  checked={chargeTax}
                  onChange={(event) => setChargeTax(event.target.checked)}
                  error={errors.chargeTax}
                />
                <FormInputNumber
                  name="weight"
                  label={`Weight (${weightUnit})`}
                  placeholder="0.0"
                  hint="Used for weight-based shipping rates. Applied to every variant created."
                  value={weight}
                  onChange={setWeight}
                  error={errors.weight}
                />
                <FormSwitch
                  name="freeShipping"
                  label="Ships free"
                  hint={FREE_SHIPPING_HINT}
                  checked={freeShipping}
                  onChange={(event) => setFreeShipping(event.target.checked)}
                  error={errors.freeShipping}
                />
              </Section>
            </div>

            <div className={panel}>
              <Section
                title="Variants"
                description={`${combinations.length} ${combinations.length === 1 ? 'variant' : 'variants'} will be created at the product price.`}
              >
                <ul className="flex flex-wrap gap-1.5">
                  {combinations.map((combination) => (
                    <li
                      key={combination.key || 'default'}
                      className="rounded-md border border-line px-2.5 py-1 text-[12.5px] text-ink-2"
                    >
                      {combination.title}
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div className={panel}>
              <Section
                title="Organization"
                description="Group this product into collections by type, vendor and tags."
              >
                <OrganizationFields
                  values={organization}
                  onChange={setOrganization}
                  errors={errors}
                />
              </Section>
            </div>

            <div className={panel}>
              <Section
                title="Options"
                description="Each combination of option values becomes a variant with its own SKU, price and stock."
              >
                <OptionsPicker drafts={drafts} onChange={setDrafts} error={optionsError(errors)} />
              </Section>
            </div>
          </div>
        </TabPanel>

        <TabPanel idPrefix="product-create" id="seo" active={tab === 'seo'}>
          <div className={panel}>
            <SeoFields
              pathPrefix="/products"
              entityLabel="product"
              title={title}
              slug=""
              seoTitle={seoTitle}
              onSeoTitleChange={setSeoTitle}
              seoDescription={seoDescription}
              onSeoDescriptionChange={setSeoDescription}
              errors={errors}
              collapsible={false}
            />
          </div>
        </TabPanel>

        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton
            type="button"
            variant="secondary"
            onClick={() => router.visit('/admin/products')}
          >
            Cancel
          </FormButton>
          <FormButton
            loading={createProduct.isPending}
            disabled={mediaBusy}
            title={mediaBusy ? 'Wait for photos to finish uploading' : undefined}
          >
            Create product
          </FormButton>
        </div>
      </form>
    </Page>
  )
}

AdminProductsCreate.layout = [AdminLayout]
