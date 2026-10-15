import {
  FormSelectWithSearch,
  FormTagsInput,
  type FormSelectWithSearchOption,
} from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { PRODUCT_LABEL_COLOR_CLASSES } from '~/lib/product_label'
import { cn } from '~/lib/styles'
import { useAdminProductFacets } from './_hooks'
import { type LabelChoice, type NamedChoice } from './_types'

export type OrganizationValues = {
  productTypeId: string
  vendorId: string
  productLabelId: string
  tags: string[]
}

type CurrentChoice = (NamedChoice & { isActive: boolean }) | null

type CurrentLabel = (LabelChoice & { isActive: boolean }) | null

type OrganizationFieldsProps = {
  values: OrganizationValues
  onChange: (values: OrganizationValues) => void
  errors: FieldErrors
  disabled?: boolean
  /** The product's saved type, vendor and label, kept selectable when archived. */
  current?: { productType: CurrentChoice; vendor: CurrentChoice; productLabel?: CurrentLabel }
}

function choiceOptions(choices: NamedChoice[], current: CurrentChoice) {
  const options: FormSelectWithSearchOption[] = choices.map(({ id, name }) => ({
    value: id,
    label: name,
  }))
  if (current && !choices.some(({ id }) => id === current.id)) {
    options.unshift({
      value: current.id,
      label: current.name,
      badge: current.isActive ? undefined : { label: 'Archived' },
    })
  }
  return options
}

function labelSwatch(label: LabelChoice) {
  return (
    <span
      aria-hidden="true"
      className={cn('size-2.5 flex-none rounded-full', PRODUCT_LABEL_COLOR_CLASSES[label.color])}
    />
  )
}

function labelOptions(labels: LabelChoice[], current: CurrentLabel) {
  const options: FormSelectWithSearchOption[] = labels.map((label) => ({
    value: label.id,
    label: label.name,
    icon: labelSwatch(label),
  }))
  if (current && !labels.some(({ id }) => id === current.id)) {
    options.unshift({
      value: current.id,
      label: current.name,
      icon: labelSwatch(current),
      badge: current.isActive ? undefined : { label: 'Archived' },
    })
  }
  return options
}

/**
 * Product type, vendor, label and tags. Automated collections match on the
 * type, vendor and tags; the label is shown over the cover photo in the store.
 */
export default function OrganizationFields({
  values,
  onChange,
  errors,
  disabled = false,
  current,
}: OrganizationFieldsProps) {
  const { data: facets, isLoading } = useAdminProductFacets()
  const tagsError = Object.entries(errors).find(([key]) => key.startsWith('tags'))?.[1]

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:max-[1099px]:grid-cols-2">
        <FormSelectWithSearch
          name="productTypeId"
          label="Product type"
          placeholder="No product type"
          searchPlaceholder="Search product types…"
          noOptionsText="No product types. Add them under Catalog → Product types."
          options={choiceOptions(facets?.productTypes ?? [], current?.productType ?? null)}
          value={values.productTypeId}
          isLoading={isLoading}
          disabled={disabled}
          clearable
          onChange={(productTypeId) => onChange({ ...values, productTypeId })}
          error={errors.productTypeId}
        />
        <FormSelectWithSearch
          name="vendorId"
          label="Vendor"
          placeholder="No vendor"
          searchPlaceholder="Search vendors…"
          noOptionsText="No vendors. Add them under Catalog → Vendors."
          options={choiceOptions(facets?.vendors ?? [], current?.vendor ?? null)}
          value={values.vendorId}
          isLoading={isLoading}
          disabled={disabled}
          clearable
          onChange={(vendorId) => onChange({ ...values, vendorId })}
          error={errors.vendorId}
        />
        <FormSelectWithSearch
          name="productLabelId"
          label="Label"
          placeholder="No label"
          searchPlaceholder="Search labels…"
          noOptionsText="No labels. Add them under Catalog → Labels."
          options={labelOptions(facets?.productLabels ?? [], current?.productLabel ?? null)}
          value={values.productLabelId}
          isLoading={isLoading}
          disabled={disabled}
          clearable
          onChange={(productLabelId) => onChange({ ...values, productLabelId })}
          error={errors.productLabelId}
        />
      </div>
      <FormTagsInput
        name="tags"
        label="Tags"
        values={values.tags}
        suggestions={facets?.tags}
        disabled={disabled}
        onChange={(tags) => onChange({ ...values, tags })}
        error={tagsError}
        hint="Used by automated collections, e.g. new, bestseller, exclude-from-sale."
      />
    </>
  )
}
