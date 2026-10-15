import vine from '@vinejs/vine'
import {
  HELP_ICONS,
  HELP_INTERNAL_PATH,
  MAX_HELP_BODY_LENGTH,
  MAX_HELP_GROUPS,
  MAX_HELP_KEYWORDS,
  MAX_HELP_RELATED,
} from '#constants/help'

const position = () => vine.number({ strict: true }).withoutDecimals().min(0).max(1000)

/** A URL handle; blank means "generate from the title". */
const slug = () => vine.string().trim().maxLength(100).nullable().optional()

export const helpCategoryFields = () => ({
  title: vine.string().trim().minLength(1).maxLength(120),
  slug: slug(),
  description: vine.string().trim().minLength(1).maxLength(300),
  icon: vine.enum(HELP_ICONS),
  popular: vine.boolean({ strict: true }),
  position: position(),
  groups: vine
    .array(
      vine.object({
        id: vine.string().uuid().nullable(),
        title: vine.string().trim().minLength(1).maxLength(120),
        position: position(),
      })
    )
    .maxLength(MAX_HELP_GROUPS),
})

export const helpArticleFields = () => ({
  title: vine.string().trim().minLength(1).maxLength(160),
  slug: slug(),
  description: vine.string().trim().minLength(1).maxLength(300),
  categoryId: vine.string().uuid(),
  groupId: vine.string().uuid().nullable(),
  keywords: vine
    .array(vine.string().trim().minLength(1).maxLength(60))
    .maxLength(MAX_HELP_KEYWORDS)
    .distinct(),
  bodyMarkdown: vine.string().trim().minLength(1).maxLength(MAX_HELP_BODY_LENGTH),
  popular: vine.boolean({ strict: true }),
  position: position(),
  ctaLabel: vine.string().trim().maxLength(60).nullable(),
  ctaHref: vine.string().trim().maxLength(200).regex(HELP_INTERNAL_PATH).nullable(),
  status: vine.enum(['draft', 'active'] as const),
  relatedIds: vine.array(vine.string().uuid()).maxLength(MAX_HELP_RELATED).distinct(),
})
