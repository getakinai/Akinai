import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { FormSelectWithSearch } from '~/components/form'
import { IconButton, Skeleton } from '~/components/ui'
import { useDebouncedValue } from '~/hooks/use_debounced_value'
import { type FieldErrors } from '~/lib/http'
import { card, field } from '~/lib/styles'
import { useCan } from '../../_hooks'
import { addressLines, customerDisplayName } from '../../customers/_format'
import { type AdminCustomerAddress } from '../../customers/_types'
import { orderAddressLines } from '../_format'
import { orderCustomerQuery, useOrderCustomer, useOrderCustomers } from '../_hooks'
import { type DraftCustomer, type OrderAddress } from '../_types'
import CreateCustomerDialog from './_create_customer_dialog'

type CustomerCardProps = {
  customer: DraftCustomer | null
  onCustomerChange: (customer: DraftCustomer | null, defaultAddressId: string | null) => void
  shippingAddressId: string | null
  onShippingAddressChange: (addressId: string | null) => void
  /** Address saved on the draft, shown when the customer's address book can't be read. */
  savedAddress: OrderAddress | null
  errors: FieldErrors
  disabled?: boolean
}

function addressOption(address: AdminCustomerAddress) {
  const [first, ...rest] = addressLines(address)
  return { value: address.id, label: first ?? address.address1, subtitle: rest.join(', ') }
}

export default function CustomerCard({
  customer,
  onCustomerChange,
  shippingAddressId,
  onShippingAddressChange,
  savedAddress,
  errors,
  disabled = false,
}: CustomerCardProps) {
  const canViewCustomers = useCan('customers.view')
  const canCreateCustomers = useCan('customers.create')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createKey, setCreateKey] = useState(0)
  const debouncedSearch = useDebouncedValue(search)

  const customers = useOrderCustomers(debouncedSearch, canViewCustomers && !customer && !disabled)
  const detail = useOrderCustomer(customer?.id ?? null, canViewCustomers)
  const addresses = detail.data?.addresses ?? []
  const selectedAddress = addresses.find((address) => address.id === shippingAddressId)
  const queryClient = useQueryClient()

  const pickCustomer = async (row: DraftCustomer) => {
    onCustomerChange(row, null)
    try {
      const picked = await queryClient.fetchQuery(orderCustomerQuery(row.id))
      const fallback = picked.addresses.find((address) => address.isDefault)
      if (fallback) onCustomerChange(row, fallback.id)
    } catch {
      // Keep the customer without an address; staff can still pick one.
    }
  }

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Customer</span>
          <h2 className={card.title}>{customer ? customerDisplayName(customer) : 'No customer'}</h2>
        </div>
        {customer && !disabled && (
          <IconButton
            label="Remove customer"
            size="sm"
            onClick={() => onCustomerChange(null, null)}
          >
            <X size={15} />
          </IconButton>
        )}
      </header>

      {!customer ? (
        canViewCustomers ? (
          <div className="flex flex-col gap-3">
            <FormSelectWithSearch
              name="customerId"
              label="Search or create a customer"
              hideLabel
              placeholder="Search or create a customer"
              searchPlaceholder="Name or email"
              noOptionsText={debouncedSearch ? 'No customers match' : 'No customers yet'}
              options={(customers.data?.data ?? []).map((row) => ({
                value: row.id,
                label: customerDisplayName(row),
                subtitle: row.fullName ? row.email : undefined,
              }))}
              value=""
              isLoading={customers.isFetching && !customers.data}
              disabled={disabled}
              error={errors.customerId}
              onSearch={setSearch}
              onChange={(id) => {
                const row = customers.data?.data.find((item) => item.id === id)
                if (row) void pickCustomer(row)
              }}
            />
            {canCreateCustomers && !disabled && (
              <button
                type="button"
                className={card.action}
                onClick={() => {
                  setCreateKey((key) => key + 1)
                  setCreateOpen(true)
                }}
              >
                <Plus size={14} /> Create customer
              </button>
            )}
          </div>
        ) : (
          <p className="text-[13.5px] text-muted">
            You need access to customers to add one to this order.
          </p>
        )
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-0.5 text-[13.5px]">
            <span className={field.label}>Contact information</span>
            <span className="truncate text-ink-2">{customer.email}</span>
            {detail.data?.phone && <span className="text-ink-2">{detail.data.phone}</span>}
          </div>

          <div className="flex flex-col gap-2">
            {canViewCustomers && detail.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : canViewCustomers && detail.data ? (
              addresses.length > 0 ? (
                <FormSelectWithSearch
                  name="shippingAddressId"
                  label="Shipping address"
                  placeholder="No shipping address"
                  options={addresses.map(addressOption)}
                  value={shippingAddressId ?? ''}
                  clearable
                  showTriggerSubtitle={false}
                  disabled={disabled}
                  error={errors.shippingAddressId}
                  onChange={(id) => onShippingAddressChange(id || null)}
                />
              ) : (
                <>
                  <span className={field.label}>Shipping address</span>
                  <p className="text-[13.5px] text-muted">
                    This customer has no saved addresses. Add one on their customer page.
                  </p>
                </>
              )
            ) : (
              <>
                <span className={field.label}>Shipping address</span>
                <p className="text-[13.5px] text-ink-2">
                  {savedAddress ? orderAddressLines(savedAddress).join(', ') : 'None'}
                </p>
              </>
            )}
            {selectedAddress && (
              <p className="text-[13px] leading-relaxed text-muted">
                {addressLines(selectedAddress).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      <CreateCustomerDialog
        key={createKey}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) =>
          onCustomerChange(
            created,
            created.addresses.find((address) => address.isDefault)?.id ?? null
          )
        }
      />
    </section>
  )
}
