import vine from '@vinejs/vine'

/** The `:key` route param of a plugin install or uninstall. */
export const adminPluginsInstallValidator = vine.create({
  params: vine.object({
    key: vine.string().trim().minLength(1).maxLength(60),
  }),
})
