import type { ReactNode } from 'react'
import { useStorefrontPlugins } from '~/pages/_hooks'
import { pluginRegistry } from './registry'
import type { PluginSlotName } from './types'

type PluginSlotComponentProps = {
  name: PluginSlotName
  /** Shown when no installed plugin fills the slot. */
  fallback?: ReactNode
  /**
   * Shown while the installed plugins load, which only happens on Inertia
   * visits. Defaults to the first registered plugin's `Skeleton`.
   */
  loading?: ReactNode
}

/**
 * A placeholder in a storefront template. Renders every installed plugin
 * that fills `name`, in registry order, or `fallback` when none does.
 */
export default function PluginSlot({ name, fallback, loading }: PluginSlotComponentProps) {
  const { data: installed, isLoading } = useStorefrontPlugins()
  const candidates = Object.entries(pluginRegistry).filter(([, entry]) => entry.slot === name)
  if (candidates.length === 0) return <>{fallback}</>

  if (isLoading) {
    if (loading !== undefined) return <>{loading}</>
    const Skeleton = candidates.find(([, entry]) => entry.Skeleton)?.[1].Skeleton
    return Skeleton ? <Skeleton /> : null
  }

  const installedKeys = new Set(
    (installed ?? []).filter((plugin) => plugin.slots.includes(name)).map((plugin) => plugin.key)
  )
  const entries = candidates.filter(([key]) => installedKeys.has(key))
  if (entries.length === 0) return <>{fallback}</>

  return (
    <>
      {entries.map(([key, { Component }]) => (
        <Component key={key} fallback={fallback} />
      ))}
    </>
  )
}
