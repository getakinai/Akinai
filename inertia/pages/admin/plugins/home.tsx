import { useState } from 'react'
import { toast } from 'sonner'
import { Puzzle, Settings2 } from 'lucide-react'
import { Link } from '@adonisjs/inertia/react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import type { NavRoute } from '~/components/nav_link'
import { Badge, Dialog, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { buttonClasses, card } from '~/lib/styles'
import { useCan } from '../_hooks'
import { useAdminPlugins, useSetAdminPluginInstalled } from './_hooks'
import type { AdminPlugin } from './_types'

const CATEGORY_LABELS: Record<string, string> = {
  storefront: 'Storefront',
  payments: 'Payments',
  marketing: 'Marketing',
}

function onError(error: unknown) {
  toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
}

function PluginCard({
  plugin,
  canEdit,
  pending,
  onInstall,
  onUninstall,
}: {
  plugin: AdminPlugin
  canEdit: boolean
  pending: boolean
  onInstall: () => void
  onUninstall: () => void
}) {
  return (
    <li className={card.base}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-paper text-muted">
          <Puzzle size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">{plugin.name}</h2>
            {plugin.isInstalled ? (
              <Badge tone="success" dot>
                Installed
              </Badge>
            ) : (
              <Badge tone="neutral">Not installed</Badge>
            )}
          </div>
          <div className={card.eyebrow}>{CATEGORY_LABELS[plugin.category] ?? plugin.category}</div>
          <p className="mt-2 text-[13px] text-pretty text-muted">{plugin.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {plugin.isInstalled && plugin.adminRoute && (
          <Link
            route={plugin.adminRoute as NavRoute}
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            <Settings2 size={14} /> Configure
          </Link>
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
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          aria-busy="true"
          aria-label="Loading plugins"
        >
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
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
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(plugins ?? []).map((plugin) => (
            <PluginCard
              key={plugin.key}
              plugin={plugin}
              canEdit={canEdit}
              pending={pendingKey === plugin.key}
              onInstall={() => install(plugin)}
              onUninstall={() => setUninstalling(plugin)}
            />
          ))}
        </ul>
      )}

      <Dialog
        open={uninstalling !== null}
        onClose={() => setUninstalling(null)}
        title="Uninstall plugin?"
        description={
          uninstalling
            ? `${uninstalling.name} will be removed from the storefront. Its settings and content are kept, so installing it again restores them.`
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
