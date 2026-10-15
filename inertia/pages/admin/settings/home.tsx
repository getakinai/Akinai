import { useState, type ReactNode } from 'react'
import { Bell, Building2, MapPin, ShoppingBag, Store, UserRound } from 'lucide-react'
import Page from '~/components/page'
import { Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { countryFlag, countryName } from '~/lib/countries'
import {
  BUSINESS_TYPE_LABELS,
  DEFAULT_CHECKOUT_DELIVERY_HEADING,
  DEFAULT_CHECKOUT_DELIVERY_NOTE,
} from '~/lib/store_settings'
import { card } from '~/lib/styles'
import { useCan } from '../_hooks'
import AddressDialog from './_address_dialog'
import BusinessDialog from './_business_dialog'
import CheckoutDialog from './_checkout_dialog'
import ContactDialog from './_contact_dialog'
import DefaultsForm from './_defaults_form'
import { useAdminStoreSettings } from './_hooks'
import MaintenanceSection from './_maintenance_section'
import NotificationsDialog from './_notifications_dialog'
import SummaryRow from './_summary_row'
import { type AdminStoreSettings } from './_types'

type OpenDialog = 'business' | 'contact' | 'address' | 'notifications' | 'checkout' | null

const rowsCard = 'overflow-hidden rounded-card border border-line-2 bg-card divide-y divide-line'

function joinParts(parts: Array<string | null | undefined>, separator = ', ') {
  return parts.filter((part) => part && part.trim() !== '').join(separator)
}

function formatAddress(
  line1: string | null,
  suburb: string | null,
  city: string | null,
  region: string | null,
  postalCode: string | null,
  country: string | null
) {
  return joinParts([
    line1,
    suburb,
    city,
    joinParts([region, postalCode], ' '),
    country ? countryName(country) : null,
  ])
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <header>
        <h2 className="text-[15px] font-[560] tracking-[-0.01em]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[13.5px] text-pretty text-muted">{description}</p>
        )}
      </header>
      {children}
    </section>
  )
}

export default function AdminStoreSettingsHome() {
  const { data: settings, isLoading, isError, refetch } = useAdminStoreSettings()

  return (
    <Page
      title="Store details"
      description="Business, contact and regional defaults shown across your storefront."
    >
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8">
        {isLoading ? (
          <div className={`${card.base} flex flex-col gap-3`} aria-busy="true">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError || !settings ? (
          <div className={`${card.base} py-12 text-center text-[14px] text-muted`}>
            Could not load the store details.{' '}
            <button type="button" className="underline" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : (
          <StoreSettings settings={settings} />
        )}
      </div>
    </Page>
  )
}

function StoreSettings({ settings }: { settings: AdminStoreSettings }) {
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)
  const canEdit = useCan('store_settings.edit')
  const canViewMaintenance = useCan('maintenance.view')
  const canEditMaintenance = useCan('maintenance.edit')
  const edit = (dialog: Exclude<OpenDialog, null>) =>
    canEdit ? () => setOpenDialog(dialog) : undefined
  const close = () => setOpenDialog(null)

  const businessSummary = settings.businessType
    ? joinParts(
        [
          settings.legalName,
          BUSINESS_TYPE_LABELS[settings.businessType],
          settings.businessCountryCode ? countryName(settings.businessCountryCode) : null,
        ],
        ' • '
      )
    : 'Add your business type and country'

  const ownerName = joinParts([settings.ownerFirstName, settings.ownerLastName], ' ')
  const ownerSummary = ownerName
    ? joinParts(
        [
          joinParts([settings.ownerEmail, settings.ownerPhone], ' · '),
          formatAddress(
            settings.ownerAddressLine1,
            settings.ownerSuburb,
            settings.ownerCity,
            settings.ownerRegion,
            settings.ownerPostalCode,
            settings.businessCountryCode
          ),
        ],
        ' • '
      )
    : 'Add the name, contact and residential address of the business owner'

  const flag = settings.businessCountryCode ? countryFlag(settings.businessCountryCode) : ''

  const storeAddress =
    formatAddress(
      settings.storeAddressLine1,
      settings.storeSuburb,
      settings.storeCity,
      settings.storeRegion,
      settings.storePostalCode,
      settings.storeCountryCode
    ) || 'Add the address customers see'

  return (
    <>
      {canViewMaintenance && (
        <SettingsSection
          title="Maintenance mode"
          description="Take the storefront offline while you make changes."
        >
          <MaintenanceSection canEdit={canEditMaintenance} />
        </SettingsSection>
      )}

      <SettingsSection
        title="Business details"
        description="Business entity used for financial products, markets, apps and taxes in this store."
      >
        <div className={rowsCard}>
          <SummaryRow
            icon={
              flag ? (
                <span aria-hidden="true" className="text-[22px] leading-none">
                  {flag}
                </span>
              ) : (
                <Building2 size={18} />
              )
            }
            title="Business entity"
            subtitle={businessSummary}
            onEdit={edit('business')}
          />
          <SummaryRow
            icon={<UserRound size={18} />}
            title={ownerName || 'Owner details'}
            subtitle={ownerSummary}
            onEdit={edit('business')}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Store contact details">
        <div className={rowsCard}>
          <SummaryRow
            icon={<Store size={18} />}
            title={settings.storeName}
            subtitle={
              joinParts([settings.contactEmail, settings.phone], ' · ') ||
              'Add the email and phone customers can reach you on'
            }
            onEdit={edit('contact')}
          />
          <SummaryRow
            icon={<MapPin size={18} />}
            title="Store address"
            subtitle={storeAddress}
            onEdit={edit('address')}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Notifications"
        description="Who on your team hears about new orders and return requests."
      >
        <div className={rowsCard}>
          <SummaryRow
            icon={<Bell size={18} />}
            title="Staff order notifications"
            subtitle={
              settings.orderNotificationEmails.length > 0
                ? settings.orderNotificationEmails.join(', ')
                : settings.ownerEmail
                  ? `Owner email (${settings.ownerEmail})`
                  : 'Add an email to get new order alerts'
            }
            onEdit={edit('notifications')}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Checkout"
        description="The message customers see above the delivery address at checkout."
      >
        <div className={rowsCard}>
          <SummaryRow
            icon={<ShoppingBag size={18} />}
            title={settings.checkoutDeliveryHeading ?? DEFAULT_CHECKOUT_DELIVERY_HEADING}
            subtitle={settings.checkoutDeliveryNote ?? DEFAULT_CHECKOUT_DELIVERY_NOTE}
            onEdit={edit('checkout')}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Store defaults">
        <div className={card.base}>
          <DefaultsForm key={settings.id} settings={settings} disabled={!canEdit} />
        </div>
      </SettingsSection>

      {openDialog === 'business' && <BusinessDialog open settings={settings} onClose={close} />}
      {openDialog === 'contact' && <ContactDialog open settings={settings} onClose={close} />}
      {openDialog === 'address' && <AddressDialog open settings={settings} onClose={close} />}
      {openDialog === 'notifications' && (
        <NotificationsDialog open settings={settings} onClose={close} />
      )}
      {openDialog === 'checkout' && <CheckoutDialog open settings={settings} onClose={close} />}
    </>
  )
}

AdminStoreSettingsHome.layout = [AdminLayout]
