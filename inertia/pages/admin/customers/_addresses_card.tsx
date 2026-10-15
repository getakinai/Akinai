import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { FormButton } from '~/components/form'
import { Badge, IconButton } from '~/components/ui'
import { HttpError } from '~/lib/http'
import { card } from '~/lib/styles'
import AddressDialog from './_address_dialog'
import DeleteAddressDialog from './_delete_address_dialog'
import { addressLines } from './_format'
import { useUpdateAdminCustomerAddress } from './_hooks'
import { type AdminCustomerAddress, type AdminCustomerDetail } from './_types'

type AddressesCardProps = {
  customer: AdminCustomerDetail
  editable: boolean
}

type DialogState = { address: AdminCustomerAddress | null } | null

export default function AddressesCard({ customer, editable }: AddressesCardProps) {
  const [dialog, setDialog] = useState<DialogState>(null)
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null)
  const updateAddress = useUpdateAdminCustomerAddress()
  const deleteAddress = customer.addresses.find(({ id }) => id === deleteAddressId) ?? null
  const count = customer.addresses.length

  function onMakeDefault(address: AdminCustomerAddress) {
    const { id, customerId, createdAt, updatedAt, ...fields } = address
    updateAddress.mutate(
      { id, customerId, ...fields, isDefault: true },
      {
        onSuccess: () => toast.success('Default address updated'),
        onError: (error) =>
          toast.error(error instanceof HttpError ? error.message : 'Something went wrong'),
      }
    )
  }

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Addresses</span>
          <h2 className={card.title}>
            {count} saved {count === 1 ? 'address' : 'addresses'}
          </h2>
        </div>
        {editable && (
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setDialog({ address: null })}
          >
            <Plus size={15} /> Add address
          </FormButton>
        )}
      </header>

      {count === 0 ? (
        <p className="py-6 text-center text-[13.5px] text-muted">No saved addresses.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {customer.addresses.map((address) => (
            <li
              key={address.id}
              className="flex min-w-0 flex-col gap-3 rounded-lg border border-line p-4"
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <address className="min-w-0 text-[13.5px] leading-relaxed break-words text-ink not-italic">
                  {addressLines(address).map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </address>
                {address.isDefault && <Badge tone="primary">Default</Badge>}
              </div>
              {editable && (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {!address.isDefault && (
                    <FormButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      loading={
                        updateAddress.isPending && updateAddress.variables?.id === address.id
                      }
                      onClick={() => onMakeDefault(address)}
                    >
                      <Star size={14} /> Make default
                    </FormButton>
                  )}
                  <IconButton label="Edit address" onClick={() => setDialog({ address })}>
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton label="Delete address" onClick={() => setDeleteAddressId(address.id)}>
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {dialog && (
        <AddressDialog
          key={dialog.address?.id ?? 'new'}
          open
          customerId={customer.id}
          address={dialog.address}
          onClose={() => setDialog(null)}
        />
      )}
      <DeleteAddressDialog address={deleteAddress} onClose={() => setDeleteAddressId(null)} />
    </section>
  )
}
