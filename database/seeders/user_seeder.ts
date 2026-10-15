import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import RoleService from '#services/role_service'
import UserService from '#services/user_service'
import env from '#start/env'

export default class extends BaseSeeder {
  static environment = ['development']

  async run() {
    const userService = await app.container.make(UserService)
    const roleService = await app.container.make(RoleService)
    const email = 'admin@example.com'
    const admin = await roleService.findBySlug('admin')

    const existing = await userService.findByEmail(email)
    if (existing) {
      if (admin && !existing.roleId) {
        await roleService.assignToUser(existing, admin)
      }
      return
    }

    const password = env.get('SEED_ADMIN_PASSWORD') || (app.inDev ? 'password123' : null)
    if (!password) {
      throw new Error('Set SEED_ADMIN_PASSWORD before seeding the admin user outside development')
    }

    await userService.create({
      fullName: 'Store Admin',
      email,
      password,
      roleId: admin?.id,
    })
  }
}
