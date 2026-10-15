import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Page from '~/components/page'
import Section from '~/components/section'
import { FormButton, FormInput } from '~/components/form'
import { Dialog, IconButton, Skeleton } from '~/components/ui'
import { HttpError } from '~/lib/http'
import AdminLayout from '~/layouts/admin'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { card, panel } from '~/lib/styles'
import { useCan } from '../_hooks'
import {
  useAdminOption,
  useCreateAdminOptionValue,
  useDeleteAdminOptionValue,
  useUpdateAdminOption,
  useUpdateAdminOptionValue,
} from './_hooks'
import { AdminOptionNameFormSchema, AdminOptionValueFormSchema } from './_types'

export default function AdminOptionsEdit({ id }: { id: string }) {
  const { data: option, isLoading, isError, refetch } = useAdminOption(id)
  const updateOption = useUpdateAdminOption()
  const createValue = useCreateAdminOptionValue(id)
  const updateValue = useUpdateAdminOptionValue(id)
  const deleteValue = useDeleteAdminOptionValue(id)
  const canEdit = useCan('options.edit')
  const [name, setName] = useState<string | null>(null)
  const [newValue, setNewValue] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [valueErrors, setValueErrors] = useState<Record<string, string>>({})
  const [valueToDelete, setValueToDelete] = useState<{ id: string; value: string } | null>(null)

  const displayName = name ?? option?.name ?? ''

  function onSaveName(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminOptionNameFormSchema.safeParse({ name: displayName })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
    setErrors({})
    updateOption.mutate(
      { id, ...parsed.data },
      {
        onSuccess: (saved) => toast.success(`${saved.name} saved`),
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  function onConfirmDeleteValue() {
    if (!valueToDelete) return
    const target = valueToDelete
    deleteValue.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${target.value} deleted`)
        setValueToDelete(null)
      },
      onError: (error) => {
        toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
      },
    })
  }

  function onAddValue(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminOptionValueFormSchema.safeParse({ value: newValue })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))
    setErrors({})
    createValue.mutate(parsed.data, {
      onSuccess: (entry) => {
        toast.success(`${entry.value} added`)
        setNewValue('')
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <Page
      eyebrow={
        <Link route="admin.options.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Options
        </Link>
      }
      title={option?.name ?? 'Option'}
      description="Edit the option name and manage the values products can choose from."
    >
      {isLoading ? (
        <div className={`${card.base} flex flex-col gap-3`} aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !option ? (
        <div className={`${card.base} py-12 text-center text-[14px] text-muted`}>
          Could not load this option.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {!option.isActive && (
            <p className={`${card.base} text-[13.5px] text-muted`}>
              This option is archived. Unarchive it from the list before editing values.
            </p>
          )}
          <form className={panel} onSubmit={onSaveName} noValidate>
            <Section title="Name">
              <FormInput
                name="name"
                label="Option name"
                tooltip="Saving also updates this option's name, values and variant titles on every product that uses it."
                value={displayName}
                disabled={!canEdit || !option.isActive}
                onChange={(event) => setName(event.target.value)}
                error={errors.name}
              />
              {canEdit && option.isActive && (
                <div className="flex justify-end">
                  <FormButton size="sm" loading={updateOption.isPending}>
                    Save name
                  </FormButton>
                </div>
              )}
            </Section>
          </form>

          <section className={panel}>
            <Section
              title="Values"
              description="These values appear as checkboxes when you configure a product."
            >
              <ul className="flex flex-col divide-y divide-line">
                {option.values.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-2 py-2.5 sm:items-center">
                    <div className="min-w-0 flex-1">
                      <FormInput
                        name={`value-${entry.id}`}
                        label={entry.value}
                        hideLabel
                        defaultValue={entry.value}
                        disabled={!canEdit || !option.isActive}
                        error={valueErrors[entry.id]}
                        onBlur={(event) => {
                          const parsed = AdminOptionValueFormSchema.safeParse({
                            value: event.target.value,
                          })
                          if (!parsed.success) {
                            setValueErrors((current) => ({
                              ...current,
                              [entry.id]: parsed.error.issues[0].message,
                            }))
                            return
                          }
                          if (parsed.data.value === entry.value) return
                          updateValue.mutate(
                            { valueId: entry.id, ...parsed.data },
                            {
                              onSuccess: () => {
                                setValueErrors((current) => {
                                  const next = { ...current }
                                  delete next[entry.id]
                                  return next
                                })
                                toast.success('Value saved')
                              },
                              onError: (error) =>
                                handleMutationError(error, (fieldErrors) =>
                                  setValueErrors((current) => ({
                                    ...current,
                                    [entry.id]: fieldErrors.value ?? error.message,
                                  }))
                                ),
                            }
                          )
                        }}
                      />
                    </div>
                    {canEdit && option.isActive && (
                      <IconButton
                        label={`Delete ${entry.value}`}
                        size="sm"
                        onClick={() => setValueToDelete({ id: entry.id, value: entry.value })}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    )}
                  </li>
                ))}
              </ul>

              {canEdit && option.isActive && (
                <form
                  className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start"
                  onSubmit={onAddValue}
                  noValidate
                >
                  <div className="min-w-0 flex-1">
                    <FormInput
                      name="newValue"
                      label="New value"
                      hideLabel
                      placeholder="Add a value"
                      value={newValue}
                      onChange={(event) => setNewValue(event.target.value)}
                      error={errors.value}
                    />
                  </div>
                  <FormButton type="submit" size="sm" loading={createValue.isPending}>
                    Add value
                  </FormButton>
                </form>
              )}
            </Section>
          </section>
        </div>
      )}

      <Dialog
        open={valueToDelete !== null}
        onClose={() => setValueToDelete(null)}
        title="Delete value?"
        description={
          valueToDelete ? (
            <>
              Delete <strong className="font-medium text-ink">{valueToDelete.value}</strong>?
              Products that use this value may lose variants when options are saved.
            </>
          ) : null
        }
      >
        <form
          className="flex flex-wrap justify-end gap-2.5"
          onSubmit={(event) => {
            event.preventDefault()
            onConfirmDeleteValue()
          }}
        >
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setValueToDelete(null)}
          >
            Cancel
          </FormButton>
          <FormButton type="submit" variant="danger" size="sm" loading={deleteValue.isPending}>
            Delete value
          </FormButton>
        </form>
      </Dialog>
    </Page>
  )
}

AdminOptionsEdit.layout = [AdminLayout]
