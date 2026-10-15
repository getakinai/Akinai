import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `toObject` expects `role` to be preloaded (UserRepository.paginate,
 * UserService.findDetail/create/update). `toMe` also needs
 * `role.permissions`.
 */
export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    const { role } = this.resource

    return {
      ...this.pick(this.resource, [
        'id',
        'fullName',
        'email',
        'status',
        'roleId',
        'createdAt',
        'updatedAt',
        'initials',
      ]),
      role: role
        ? { id: role.id, name: role.name, slug: role.slug, isLocked: role.isLocked }
        : null,
    }
  }

  /**
   * The signed-in User with their role and resolved permission keys.
   */
  toMe() {
    return {
      ...this.toObject(),
      permissions: this.resource.permissionKeys as string[],
    }
  }
}
