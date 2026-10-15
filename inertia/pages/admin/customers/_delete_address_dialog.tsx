import { toast } from 'sonner'
import { FormButton } from '~/components/form'
import { Dialog } from '~/components/ui'
import { HttpError } from '~/lib/http'
import { useDeleteAdminCustomerAddress } from './_hooks'
import { type AdminCustomerAddress } from './_types'

type DeleteAddressDialogProps = {
  address: AdminCustomerAddress | null
  onClose: () => void
}

export default function DeleteAddressDialog({ address, onClose }: DeleteAddressDialogProps) {
  const deleteAddress = useDeleteAdminCustomerAddress()

  function onConfirm() {
    if (!address) return
    deleteAddress.mutate(
      { customerId: address.customerId, id: address.id },
      {
        onSuccess: () => {
          toast.success('Address deleted')
          onClose()
        },
        onError: (error) => {
          toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
        },
      }
    )
  }

  return (
    <Dialog
      open={address !== null}
      onClose={onClose}
      title="Delete address"
      description={
        address ? (
          <>
            Delete <strong className="font-medium text-ink">{address.address1}</strong>?
            {address.isDefault && ' The newest remaining address becomes the default.'}
          </>
        ) : null
      }
    >
      <div className="flex justify-end gap-2.5">
        <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </FormButton>
        <FormButton
          type="button"
          variant="danger"
          size="sm"
          loading={deleteAddress.isPending}
          onClick={onConfirm}
        >
          Delete address
        </FormButton>
      </div>
    </Dialog>
  )
}
