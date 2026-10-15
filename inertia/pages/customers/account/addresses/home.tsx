import { useState } from 'react'
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { FormButton } from '~/components/form'
import { Badge, Dialog, Skeleton } from '~/components/ui'
import AccountLayout from '~/layouts/account'
import StorefrontLayout from '~/layouts/storefront'
import { countryName } from '~/lib/countries'
import { cn, storefront } from '~/lib/styles'
import {
  useCustomerAddresses,
  useDeleteCustomerAddress,
  useSetDefaultCustomerAddress,
} from '../../_hooks'
import type { CustomerAddress } from '../../_types'
import AccountPage, { EmptyState, ErrorState } from '../_account_page'
import AddressDialog from './_address_dialog'

type Editing = { key: number; address: CustomerAddress | null } | null

const actionClass =
  'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-sf-text transition-colors hover:bg-sf-primary-soft hover:text-sf-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-55'

function addressLines(address: CustomerAddress) {
  return [
    address.company,
    address.address1,
    address.address2,
    [address.city, address.province, address.postalCode].filter(Boolean).join(' '),
    countryName(address.countryCode),
  ].filter(Boolean)
}

export default function CustomerAccountAddressesHome() {
  const addresses = useCustomerAddresses()
  const setDefault = useSetDefaultCustomerAddress()
  const deleteAddress = useDeleteCustomerAddress()
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<CustomerAddress | null>(null)

  const openDialog = (address: CustomerAddress | null) => setEditing({ key: Date.now(), address })

  function confirmDelete() {
    if (!deleting) return
    deleteAddress.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Address deleted')
        setDeleting(null)
      },
      onError: () => toast.error('We couldn’t delete this address. Please try again.'),
    })
  }

  return (
    <AccountPage
      title="Addresses"
      description="Pick one of these at checkout to skip typing it again."
      actions={
        <FormButton type="button" size="sm" onClick={() => openDialog(null)}>
          <Plus size={15} /> Add address
        </FormButton>
      }
    >
      {addresses.isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-[150px] w-full rounded-card" />
          ))}
        </div>
      )}
      {addresses.isError && (
        <ErrorState
          message="We couldn’t load your addresses."
          onRetry={() => addresses.refetch()}
        />
      )}
      {addresses.data?.length === 0 && (
        <EmptyState icon={<MapPin size={20} />} title="No saved addresses">
          <p>Add one now, or tick “Save this address” at checkout.</p>
          <button
            type="button"
            onClick={() => openDialog(null)}
            className={cn(storefront.primaryButton, 'mt-3')}
          >
            <Plus size={15} /> Add address
          </button>
        </EmptyState>
      )}
      {addresses.data && addresses.data.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {addresses.data.map((address) => (
            <li key={address.id} className={cn(storefront.card, 'flex flex-col')}>
              <div className="flex min-w-0 flex-1 gap-3 p-4">
                <span className="grid size-10 flex-none place-items-center rounded-lg bg-sf-primary-soft text-sf-primary">
                  <MapPin size={18} />
                </span>
                <div className="min-w-0 flex-1 text-[13.5px]">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <p className="text-[15px] font-semibold break-words">
                      {address.fullName || 'Address'}
                    </p>
                    {address.isDefault && <Badge tone="success">Default</Badge>}
                  </div>
                  <p className="mt-0.5 text-sf-muted">
                    {addressLines(address).map((line) => (
                      <span key={line} className="block break-words">
                        {line}
                      </span>
                    ))}
                  </p>
                  {address.phone && <p className="mt-1 text-sf-muted">{address.phone}</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1 border-t border-dashed border-sf-line px-2 py-1.5">
                <button type="button" className={actionClass} onClick={() => openDialog(address)}>
                  <Pencil size={14} /> Edit
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    className={actionClass}
                    disabled={setDefault.isPending}
                    onClick={() =>
                      setDefault.mutate(address, {
                        onSuccess: () => toast.success('Default address updated'),
                        onError: () => toast.error('We couldn’t update your default address.'),
                      })
                    }
                  >
                    <Star size={14} /> Set as default
                  </button>
                )}
                <button
                  type="button"
                  className={cn(actionClass, 'ml-auto hover:bg-danger/10 hover:text-danger')}
                  onClick={() => setDeleting(address)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <AddressDialog
          key={editing.key}
          open
          address={editing.address}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete this address?"
        description={
          deleting?.isDefault
            ? 'This is your default address. Your newest other address becomes the default.'
            : 'You can add it again later.'
        }
      >
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={() => setDeleting(null)}>
            Cancel
          </FormButton>
          <FormButton
            type="button"
            variant="danger"
            size="sm"
            loading={deleteAddress.isPending}
            onClick={confirmDelete}
          >
            Delete address
          </FormButton>
        </div>
      </Dialog>
    </AccountPage>
  )
}

CustomerAccountAddressesHome.layout = [StorefrontLayout, AccountLayout]
