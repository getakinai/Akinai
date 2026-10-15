import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Info, Settings2 } from 'lucide-react'
import { Link } from '@adonisjs/inertia/react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import type { NavRoute } from '~/components/nav_link'
import { Badge, Dialog, Sheet, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { buttonClasses, card, cn } from '~/lib/styles'
import { useCan } from '../_hooks'
import { useAdminPaymentMethods } from '../payments/_hooks'
import { isManaged, PaymentMethodDialog, type ManagedCode } from '../payments/_method_dialog'
import { STRIPE_MODE_LABELS, type AdminPaymentMethod } from '../payments/_types'
import { CATEGORY_ORDER, categoryInfo } from './_categories'
import PluginDevGuide from './_dev_guide'
import { useAdminPlugins, useSetAdminPluginInstalled } from './_hooks'
import type { AdminPlugin } from './_types'

const GUIDE_ID = 'plugin-dev-guide'
const GUIDE_SEEN_KEY = 'akinai.plugins.guideSeen'

type PluginGroup = { category: string; plugins: AdminPlugin[] }

/** Plugins grouped by category in display order; unknown categories go last. */
function groupByCategory(plugins: AdminPlugin[]): PluginGroup[] {
  const groups = new Map<string, AdminPlugin[]>()
  for (const plugin of plugins) {
    groups.set(plugin.category, [...(groups.get(plugin.category) ?? []), plugin])
  }
  const rank = (category: string) => {
    const index = CATEGORY_ORDER.indexOf(category)
    return index === -1 ? CATEGORY_ORDER.length : index
  }
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([category, entries]) => ({ category, plugins: entries }))
}

const sectionClasses = 'rounded-card border border-line-2 bg-paper p-4 sm:p-5'

function onError(error: unknown) {
  toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
}

function CategorySection({
  category,
  installed,
  total,
  children,
}: {
  category: string
  installed: number
  total: number
  children: ReactNode
}) {
  const info = categoryInfo(category)
  const headingId = `plugins-${category}`
  return (
    <section className={sectionClasses} aria-labelledby={headingId}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id={headingId} className="text-[15.5px] font-semibold text-ink">
            {info.label}
          </h2>
          {info.description && (
            <p className="mt-0.5 text-[13px] text-pretty text-muted">{info.description}</p>
          )}
        </div>
        <span className={card.eyebrow}>
          {installed} of {total} installed
        </span>
      </header>
      {children}
    </section>
  )
}

function PluginCard({
  plugin,
  canEdit,
  pending,
  payment,
  onConfigure,
  onInstall,
  onUninstall,
}: {
  plugin: AdminPlugin
  canEdit: boolean
  pending: boolean
  /** The payment method an installed payment plugin provides; undefined when unknown. */
  payment?: AdminPaymentMethod
  /** Opens the setup dialog in place of the plugin's admin page. */
  onConfigure?: () => void
  onInstall: () => void
  onUninstall: () => void
}) {
  const Icon = categoryInfo(plugin.category).icon
  const configured = payment?.configured
  return (
    <li className={`${card.base} flex flex-col`}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-paper text-muted">
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-ink">{plugin.name}</h3>
            {!plugin.isInstalled ? (
              <Badge tone="neutral">Not installed</Badge>
            ) : (
              payment &&
              (payment.configured ? (
                <>
                  <Badge tone="success" dot>
                    Active
                  </Badge>
                  {payment.mode && (
                    <Badge tone={payment.mode === 'live' ? 'success' : 'warning'}>
                      {STRIPE_MODE_LABELS[payment.mode]}
                    </Badge>
                  )}
                </>
              ) : (
                <Badge tone="warning">Not set up</Badge>
              ))
            )}
          </div>
          <p className="mt-2 text-[13px] text-pretty text-muted">{plugin.description}</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-4">
        {plugin.isInstalled && onConfigure ? (
          <FormButton type="button" variant="secondary" size="sm" onClick={onConfigure}>
            <Settings2 size={14} /> {configured === false ? 'Set up' : 'Configure'}
          </FormButton>
        ) : (
          plugin.isInstalled &&
          plugin.adminRoute &&
          !isManaged(plugin.key) && (
            <Link
              route={plugin.adminRoute as NavRoute}
              className={buttonClasses({ variant: 'secondary', size: 'sm' })}
            >
              <Settings2 size={14} /> Configure
            </Link>
          )
        )}
        {canEdit &&
          (plugin.isInstalled ? (
            <FormButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={onUninstall}
            >
              Uninstall
            </FormButton>
          ) : (
            <FormButton type="button" size="sm" loading={pending} onClick={onInstall}>
              Install
            </FormButton>
          ))}
      </div>
    </li>
  )
}

export default function AdminPluginsPage() {
  const { data: plugins, isLoading, isError, refetch } = useAdminPlugins()
  const canEdit = useCan('plugins.edit')
  const setInstalled = useSetAdminPluginInstalled()
  const [uninstalling, setUninstalling] = useState<AdminPlugin | null>(null)
  const canConfigurePayments = useCan('payments.edit')
  const paymentMethods = useAdminPaymentMethods(useCan('payments.view'))
  const [openPayment, setOpenPayment] = useState<ManagedCode | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const storedGuideSeen = useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem(GUIDE_SEEN_KEY) === '1',
    () => true
  )
  const [openedGuide, setOpenedGuide] = useState(false)
  const guideSeen = storedGuideSeen || openedGuide

  function toggleGuide() {
    if (!guideSeen) {
      window.localStorage.setItem(GUIDE_SEEN_KEY, '1')
      setOpenedGuide(true)
    }
    setGuideOpen((open) => !open)
  }
  const paymentByCode = new Map((paymentMethods.data ?? []).map((method) => [method.code, method]))

  function install(plugin: AdminPlugin) {
    setInstalled.mutate(
      { key: plugin.key, installed: true },
      { onSuccess: () => toast.success(`${plugin.name} installed`), onError }
    )
  }

  function confirmUninstall() {
    if (!uninstalling) return
    const plugin = uninstalling
    setInstalled.mutate(
      { key: plugin.key, installed: false },
      {
        onSuccess: () => {
          toast.success(`${plugin.name} uninstalled`)
          setUninstalling(null)
        },
        onError,
      }
    )
  }

  const pendingKey = setInstalled.isPending ? setInstalled.variables?.key : null

  return (
    <Page
      title="Plugins"
      description="Add features to your store. Installed plugins appear in their place on the storefront."
    >
      {isLoading ? (
        <div className={sectionClasses} aria-busy="true" aria-label="Loading plugins">
          <Skeleton className="mb-4 h-5 w-40" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }, (_, index) => (
              <Skeleton key={index} className="h-40 w-full" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className={card.base}>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-[14px] text-muted">Could not load the plugins.</span>
            <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </FormButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groupByCategory(plugins ?? []).map((group) => (
            <CategorySection
              key={group.category}
              category={group.category}
              installed={group.plugins.filter((plugin) => plugin.isInstalled).length}
              total={group.plugins.length}
            >
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {group.plugins.map((plugin) => (
                  <PluginCard
                    key={plugin.key}
                    plugin={plugin}
                    canEdit={canEdit}
                    pending={pendingKey === plugin.key}
                    payment={paymentByCode.get(plugin.key)}
                    onConfigure={
                      canConfigurePayments && isManaged(plugin.key)
                        ? () => setOpenPayment(plugin.key as ManagedCode)
                        : undefined
                    }
                    onInstall={() => install(plugin)}
                    onUninstall={() => setUninstalling(plugin)}
                  />
                ))}
              </ul>
            </CategorySection>
          ))}
        </div>
      )}

      <button
        type="button"
        aria-label="How to build a plugin"
        aria-expanded={guideOpen}
        aria-controls={GUIDE_ID}
        onClick={toggleGuide}
        className={cn(
          'fixed right-5 bottom-5 z-40 grid size-12 place-items-center rounded-full bg-ink text-paper shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
          !guideSeen && 'motion-safe:animate-bounce'
        )}
      >
        <Info size={20} />
      </button>

      <Sheet
        id={GUIDE_ID}
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Build a plugin"
        description="How bundled plugins are put together, and the categories they can use."
      >
        <PluginDevGuide />
      </Sheet>

      <PaymentMethodDialog
        code={openPayment}
        initialMarketId={null}
        onClose={() => setOpenPayment(null)}
      />

      <Dialog
        open={uninstalling !== null}
        onClose={() => setUninstalling(null)}
        title="Uninstall plugin?"
        description={
          uninstalling
            ? uninstalling.category === 'payments'
              ? `Customers won't be able to pay with ${uninstalling.name}. Its settings are kept, so installing it again restores them.`
              : `${uninstalling.name} will be removed from the storefront. Its settings and content are kept, so installing it again restores them.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2.5">
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setUninstalling(null)}
          >
            Cancel
          </FormButton>
          <FormButton
            type="button"
            variant="danger"
            size="sm"
            loading={setInstalled.isPending}
            onClick={confirmUninstall}
          >
            Uninstall
          </FormButton>
        </div>
      </Dialog>
    </Page>
  )
}

AdminPluginsPage.layout = [AdminLayout]
