import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

/** A team member a support ticket can be assigned to. */
export default class SupportAssigneeTransformer extends BaseTransformer<User> {
  toObject() {
    const user = this.resource
    return { id: user.id, name: user.fullName || user.email }
  }
}
