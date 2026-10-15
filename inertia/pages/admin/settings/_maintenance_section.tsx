import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSwitch } from '~/components/form'
import { Dialog, Skeleton } from '~/components/ui'
import { HttpError } from '~/lib/http'
import { card } from '~/lib/styles'
import { useAdminMaintenance, useUpdateAdminMaintenance } from './_hooks'

type MaintenanceSectionProps = {
  canEdit: boolean
}

export default function MaintenanceSection({ canEdit }: MaintenanceSectionProps) {
  const { data, isLoading, isError, refetch } = useAdminMaintenance()
  const updateMaintenance = useUpdateAdminMaintenance()
  const [confirming, setConfirming] = useState(false)

  function setActive(active: boolean) {
    updateMaintenance.mutate(
      { active },
      {
        onSuccess: () => {
          toast.success(active ? 'Store is now in maintenance mode' : 'Store is back online')
          setConfirming(false)
        },
        onError: (error) => {
          toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
        },
      }
    )
  }

  function onToggle(active: boolean) {
    if (active) {
      setConfirming(true)
    } else {
      setActive(false)
    }
  }

  if (isLoading) {
    return (
      <div className={card.base} aria-busy="true">
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className={`${card.base} text-[13.5px] text-muted`}>
        Could not load the maintenance status.{' '}
        <button type="button" className="underline" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className={card.base}>
      <FormSwitch
        name="maintenanceActive"
        label="Storefront in maintenance mode"
        hint="Customers see a maintenance page. Signed-in staff can still browse the store."
        checked={data.active}
        disabled={!canEdit || updateMaintenance.isPending}
        onChange={(event) => onToggle(event.target.checked)}
      />

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Turn on maintenance mode"
        description="Customers won't be able to browse or check out until you turn it off again."
      >
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </FormButton>
          <FormButton
            type="button"
            variant="danger"
            size="sm"
            loading={updateMaintenance.isPending}
            onClick={() => setActive(true)}
          >
            Turn on
          </FormButton>
        </div>
      </Dialog>
    </div>
  )
}
