import { z } from 'zod'

/** Same palette as `PRODUCT_LABEL_COLORS` on the server. */
export const PRODUCT_LABEL_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'black',
] as const

export const ProductLabelColorSchema = z.enum(PRODUCT_LABEL_COLORS)

export type ProductLabelColor = z.infer<typeof ProductLabelColorSchema>

export const ProductLabelBadgeSchema = z.object({
  name: z.string(),
  color: ProductLabelColorSchema,
})

export type ProductLabelBadgeData = z.infer<typeof ProductLabelBadgeSchema>

export const PRODUCT_LABEL_COLOR_NAMES: Record<ProductLabelColor, string> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  pink: 'Pink',
  black: 'Black',
}

/** Label colors stay the same in light and dark themes, like a printed sticker. */
export const PRODUCT_LABEL_COLOR_CLASSES: Record<ProductLabelColor, string> = {
  red: 'bg-red-600 text-white',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-400 text-neutral-900',
  green: 'bg-emerald-600 text-white',
  blue: 'bg-blue-600 text-white',
  purple: 'bg-violet-600 text-white',
  pink: 'bg-pink-500 text-white',
  black: 'bg-neutral-900 text-white',
}
