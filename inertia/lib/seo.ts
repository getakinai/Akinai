import { z } from 'zod'

export const SEO_TITLE_MAX = 70

export const SEO_DESCRIPTION_MAX = 320

/** Search listing overrides shared by product, collection and page forms. */
export const seoFormFields = {
  seoTitle: z
    .string()
    .trim()
    .max(SEO_TITLE_MAX, `Keep it under ${SEO_TITLE_MAX} characters`)
    .nullable(),
  seoDescription: z
    .string()
    .trim()
    .max(SEO_DESCRIPTION_MAX, `Keep it under ${SEO_DESCRIPTION_MAX} characters`)
    .nullable(),
}
