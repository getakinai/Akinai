import { errors as vineErrors } from '@vinejs/vine'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class CreateAdminUser extends BaseCommand {
  static commandName = 'create:admin-user'
  static description = 'Create a back-office staff User'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'Full name of the User' })
  declare name?: string

  @flags.string({ description: 'Email address used to log in' })
  declare email?: string

  @flags.string({ description: 'Password (prompted when omitted)' })
  declare password?: string

  @flags.string({ description: 'Role slug to assign', default: 'admin' })
  declare role: string

  async run() {
    const fullName = this.name ?? (await this.prompt.ask('Full name'))
    const email = this.email ?? (await this.prompt.ask('Email'))
    const password = this.password ?? (await this.prompt.secure('Password'))

    /**
     * Imported lazily: ace loads command metadata before the app boots,
     * and the validator depends on Lucid's `unique` rule.
     */
    const { default: UserService } = await import('#services/user_service')
    const { default: RoleService } = await import('#services/role_service')
    const { adminUserStoreValidator } = await import('#validators/admin_user_store_validator')

    const roleService = await this.app.container.make(RoleService)
    const role = await roleService.findBySlug(this.role)
    if (!role) {
      this.logger.error(`Role "${this.role}" does not exist. Run "node ace db:seed" first.`)
      this.exitCode = 1
      return
    }

    try {
      const payload = await adminUserStoreValidator.validate({
        fullName,
        email,
        password,
        passwordConfirmation: password,
      })

      const userService = await this.app.container.make(UserService)
      const user = await userService.create({
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        roleId: role.id,
      })

      this.logger.success(`Created admin User ${user.email} (${user.id}) with role ${role.name}`)
    } catch (error) {
      if (error instanceof vineErrors.E_VALIDATION_ERROR) {
        for (const message of error.messages) {
          this.logger.error(`${message.field}: ${message.message}`)
        }
        this.exitCode = 1
        return
      }
      throw error
    }
  }
}
