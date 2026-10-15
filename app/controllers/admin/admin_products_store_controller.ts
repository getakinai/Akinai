import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductService from '#services/product_service'
import ProductTransformer from '#transformers/product_transformer'
import { adminProductStoreValidator } from '#validators/admin_product_store_validator'

@inject()
export default class AdminProductsStoreController {
  constructor(protected productService: ProductService) {}

  async handle(ctx: HttpContext) {
    const {
      title,
      description,
      status,
      chargeTax,
      freeShipping,
      productTypeId,
      vendorId,
      productLabelId,
      tags,
      coverImage,
      galleryImages,
      seoTitle,
      seoDescription,
      price,
      compareAtPrice,
      weight,
      marketPrices,
      options,
    } = await ctx.request.validateUsing(adminProductStoreValidator)
    const product = await this.productService.create({
      title,
      description,
      status,
      chargeTax,
      freeShipping,
      productTypeId,
      vendorId,
      productLabelId,
      tags,
      coverImage,
      galleryImages,
      seoTitle,
      seoDescription,
      price,
      compareAtPrice,
      weight,
      marketPrices,
      options,
    })
    const detail = await this.productService.findDetail(product.id)

    ctx.response.status(201)
    return ctx.serialize(
      ProductTransformer.transform(detail.product, detail.locations).useVariant('toDetail')
    )
  }
}
