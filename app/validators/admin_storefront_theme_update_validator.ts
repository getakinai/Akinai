import vine from '@vinejs/vine'
import { HEX_COLOR } from '#constants/storefront'

const color = () => vine.string().trim().regex(HEX_COLOR)

export const adminStorefrontThemeUpdateValidator = vine.create({
  primaryColor: color(),
  primaryForegroundColor: color(),
  accentColor: color(),
  backgroundColor: color(),
  surfaceColor: color(),
  textColor: color(),
})
