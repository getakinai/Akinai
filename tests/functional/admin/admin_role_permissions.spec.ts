import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import RoleService from '#services/role_service'
import UserService from '#services/user_service'
import { createAdminUser } from '#tests/helpers/admin'

async function createRole(name: string) {
  const roleService = await app.container.make(RoleService)
  return roleService.create({ name, description: null })
}

test.group('Staff role permissions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('stops a role editor escalating their own role or granting permissions they lack', async ({
    client,
  }) => {
    const user = await createAdminUser(['dashboard.view', 'roles.view', 'roles.edit'])
    const userService = await app.container.make(UserService)
    await userService.loadRole(user)
    const other = await createRole('Editors')
    const roleService = await app.container.make(RoleService)
    const admin = await roleService.ensure(
      {
        slug: 'admin',
        name: 'Admin',
        description: 'Full access',
        isLocked: true,
        sortOrder: 0,
      },
      []
    )

    const ownRole = await client
      .put(`/admin/roles/${user.roleId}/permissions`)
      .json({ permission: 'customers.view', granted: true })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    ownRole.assertStatus(422)
    ownRole.assertBodyContains({ errors: [{ message: "You can't change your own role" }] })

    const missing = await client
      .put(`/admin/roles/${other.id}/permissions`)
      .json({ permission: 'customers.view', granted: true })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    missing.assertStatus(422)
    missing.assertBodyContains({
      errors: [{ message: "You can't grant a permission you don't have" }],
    })

    const themes = await client
      .put(`/admin/roles/${other.id}/permissions`)
      .json({ permission: 'themes.edit', granted: true })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    themes.assertStatus(422)
    themes.assertBodyContains({ errors: [{ message: 'Only admins can grant this permission' }] })

    const held = await client
      .put(`/admin/roles/${other.id}/permissions`)
      .json({ permission: 'dashboard.view', granted: true })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    held.assertStatus(200)

    const locked = await client
      .put(`/admin/roles/${admin.id}/permissions`)
      .json({ permission: 'customers.view', granted: true })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    locked.assertStatus(422)
    locked.assertBodyContains({
      errors: [{ message: 'The admin role always has every permission' }],
    })

    const customers = await client
      .get('/admin/customers/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)
    customers.assertStatus(403)
  })
})
