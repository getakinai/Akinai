import vine from '@vinejs/vine'
import { PLUGIN_KEYS } from '#constants/plugins'

/** The `:key` route param of a plugin install or uninstall. */
export const adminPluginsInstallValidator = vine.create({
  params: vine.object({
    key: vine.enum(PLUGIN_KEYS),
  }),
})
