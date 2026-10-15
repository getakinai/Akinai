import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ProductPolicy from '#policies/product_policy'
import ProductService from '#services/product_service'
import ProductTransformer from '#transformers/product_transformer'
import { adminProductUpdateValidator } from '#validators/admin_product_update_validator'

@inject()
export default class AdminProductsUpdateController {
  constructor(protected productService: ProductService) {}

  async handle(ctx: HttpContext) {
    const product = await this.productService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ProductPolicy).authorize('update', product)

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
    } = await ctx.request.validateUsing(adminProductUpdateValidator, {
      meta: { productId: product.id },
    })
    await this.productService.update(product, {
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
    })
    const detail = await this.productService.findDetail(product.id)

    return ctx.serialize(
      ProductTransformer.transform(detail.product, detail.locations).useVariant('toDetail')
    )
  }
}
