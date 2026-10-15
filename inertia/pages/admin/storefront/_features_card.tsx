import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { FeatureIcon } from '~/components/storefront'
import { FormButton, FormInput, FormSelect } from '~/components/form'
import { IconButton, Skeleton } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import {
  FEATURE_ICON_LABELS,
  FEATURE_ICONS,
  MAX_FEATURES,
  type FeatureIcon as FeatureIconName,
} from '~/lib/storefront'
import { card } from '~/lib/styles'
import { useAdminStorefrontFeatures, useReplaceAdminStorefrontFeatures } from './_hooks'
import { AdminStorefrontFeaturesFormSchema, type AdminStorefrontFeature } from './_types'

const ICON_OPTIONS = FEATURE_ICONS.map((value) => ({ value, label: FEATURE_ICON_LABELS[value] }))

type Row = { key: string; icon: FeatureIconName; title: string; text: string }

type FeaturesCardProps = {
  editable: boolean
}

/**
 * The short highlight tiles under the hero. When the list is empty the
 * storefront shows a neutral default set.
 */
export default function FeaturesCard({ editable }: FeaturesCardProps) {
  const { data: features, isLoading, isError, refetch } = useAdminStorefrontFeatures()

  return (
    <section className={card.base}>
      <div className={card.head}>
        <div className="min-w-0">
          <h2 className={card.title}>Feature highlights</h2>
          <p className="mt-1 text-[13px] text-pretty text-muted">
            Short tiles shown under the hero. With none saved, the storefront shows a neutral
            default set (secure checkout, delivery, support).
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading features">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : isError || !features ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="text-[14px] text-muted">Could not load the features.</span>
          <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
            Try again
          </FormButton>
        </div>
      ) : (
        <FeaturesForm features={features} editable={editable} />
      )}
    </section>
  )
}

function toRows(features: AdminStorefrontFeature[]): Row[] {
  return features.map(({ id, icon, title, text }) => ({ key: id, icon, title, text }))
}

function FeaturesForm({
  features,
  editable,
}: {
  features: AdminStorefrontFeature[]
  editable: boolean
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(features))
  const [errors, setErrors] = useState<FieldErrors>({})
  const replace = useReplaceAdminStorefrontFeatures()
  const isFull = rows.length >= MAX_FEATURES

  function patch(key: string, change: Partial<Row>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)))
  }

  function add() {
    setRows((current) => [
      ...current,
      { key: crypto.randomUUID(), icon: 'star', title: '', text: '' },
    ])
  }

  function remove(key: string) {
    setRows((current) => current.filter((row) => row.key !== key))
    setErrors({})
  }

  function move(index: number, offset: -1 | 1) {
    const target = index + offset
    if (target < 0 || target >= rows.length) return
    setRows((current) => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setErrors({})
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStorefrontFeaturesFormSchema.safeParse({
      items: rows.map(({ icon, title, text }) => ({ icon, title, text })),
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    replace.mutate(parsed.data, {
      onSuccess: (saved) => {
        setRows(toRows(saved))
        toast.success('Feature highlights saved')
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-muted">
          No custom features. The storefront shows the default set.
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-line">
          {rows.map((row, index) => (
            <li
              key={row.key}
              className="flex min-w-0 flex-col gap-3 py-3 sm:flex-row sm:items-start"
            >
              <span className="hidden size-9 shrink-0 place-items-center rounded-full bg-paper text-ink sm:grid sm:mt-6">
                <FeatureIcon name={row.icon} size={16} />
              </span>
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <FormSelect
                  name={`featureIcon${index}`}
                  label="Icon"
                  options={ICON_OPTIONS}
                  disabled={!editable}
                  value={row.icon}
                  onChange={(event) =>
                    patch(row.key, { icon: event.target.value as FeatureIconName })
                  }
                  error={errors[`items.${index}.icon`]}
                />
                <FormInput
                  name={`featureTitle${index}`}
                  label="Title"
                  placeholder="Fast delivery"
                  autoComplete="off"
                  maxLength={40}
                  disabled={!editable}
                  value={row.title}
                  onChange={(event) => patch(row.key, { title: event.target.value })}
                  error={errors[`items.${index}.title`]}
                />
                <div className="sm:col-span-2">
                  <FormInput
                    name={`featureText${index}`}
                    label="Text"
                    placeholder="Most orders arrive within two days"
                    autoComplete="off"
                    maxLength={120}
                    disabled={!editable}
                    value={row.text}
                    onChange={(event) => patch(row.key, { text: event.target.value })}
                    error={errors[`items.${index}.text`]}
                  />
                </div>
              </div>
              {editable && (
                <div className="flex shrink-0 items-center justify-end gap-1 sm:mt-6">
                  <IconButton
                    label={`Move ${row.title || 'feature'} up`}
                    size="sm"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={15} />
                  </IconButton>
                  <IconButton
                    label={`Move ${row.title || 'feature'} down`}
                    size="sm"
                    disabled={index === rows.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={15} />
                  </IconButton>
                  <IconButton
                    label={`Remove ${row.title || 'feature'}`}
                    size="sm"
                    onClick={() => remove(row.key)}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {errors.items && <p className="text-[12.5px] text-danger">{errors.items}</p>}

      {editable && (
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={isFull}
            title={isFull ? `Add at most ${MAX_FEATURES} features` : undefined}
            onClick={add}
          >
            <Plus size={15} /> Add feature
          </FormButton>
          <FormButton size="sm" loading={replace.isPending}>
            Save features
          </FormButton>
        </div>
      )}
    </form>
  )
}
