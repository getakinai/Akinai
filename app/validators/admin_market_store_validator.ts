import vine from '@vinejs/vine'
import { marketFields } from '#validators/helpers/market_fields'

export const adminMarketStoreValidator = vine.create(marketFields())
