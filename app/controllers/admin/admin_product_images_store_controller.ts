import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductImageService from '#services/product_image_service'
import UploadedImageTransformer from '#transformers/uploaded_image_transformer'
import { adminProductImageStoreValidator } from '#validators/admin_product_image_store_validator'

@inject()
export default class AdminProductImagesStoreController {
  constructor(protected productImageService: ProductImageService) {}

  async handle(ctx: HttpContext) {
    const { image } = await ctx.request.validateUsing(adminProductImageStoreValidator)
    const uploaded = await this.productImageService.upload(image)

    ctx.response.status(201)
    return ctx.serialize(UploadedImageTransformer.transform(uploaded))
  }
}
