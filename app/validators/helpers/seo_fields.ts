import vine from '@vinejs/vine'

export const SEO_TITLE_MAX = 70
export const SEO_DESCRIPTION_MAX = 320

const seoTitle = () => vine.string().trim().maxLength(SEO_TITLE_MAX)
const seoDescription = () => vine.string().trim().maxLength(SEO_DESCRIPTION_MAX)

/**
 * Search listing overrides on a JSON body. Omitted = unchanged on update;
 * empty clears.
 */
export const seoFields = () => ({
  seoTitle: seoTitle().nullable().optional(),
  seoDescription: seoDescription().nullable().optional(),
})

/** The same overrides as CSV import cells (empty cells read as omitted). */
export const seoImportFields = () => ({
  seo_title: seoTitle().optional(),
  seo_description: seoDescription().optional(),
})
