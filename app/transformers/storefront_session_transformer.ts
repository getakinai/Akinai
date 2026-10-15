import { BaseTransformer } from '@adonisjs/core/transformers'

export type StorefrontSession = {
  signedIn: boolean
  maintenance: boolean
  impersonation: { customerName: string } | null
}

export default class StorefrontSessionTransformer extends BaseTransformer<StorefrontSession> {
  toObject() {
    return {
      signedIn: this.resource.signedIn,
      maintenance: this.resource.maintenance,
      impersonation: this.resource.impersonation
        ? { customerName: this.resource.impersonation.customerName }
        : null,
    }
  }
}
