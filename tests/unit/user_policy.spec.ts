import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { AuthorizationResponse } from '@adonisjs/bouncer'
import type { Permission } from '#abilities/permissions'
import type User from '#models/user'
import UserPolicy from '#policies/user_policy'
import RoleService from '#services/role_service'
import UserService from '#services/user_service'
import { createAdminUser } from '#tests/helpers/admin'

async function withPermissions(user: User) {
  const userService = await app.container.make(UserService)
  return userService.loadRole(user)
}

async function createRole(name: string, permissions: Permission[] = []) {
  const roleService = await app.container.make(RoleService)
  const role = await roleService.create({ name, description: null })
  if (permissions.length > 0) {
    await roleService.syncPermissions(role, permissions)
    await role.load('permissions')
  }
  return role
}

function denialMessage(response: unknown) {
  return response instanceof AuthorizationResponse ? response.message : null
}

test.group('UserPolicy.update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('requires the users.edit permission', async ({ assert }) => {
    const actor = await withPermissions(await createAdminUser(['users.view']))
    const target = await withPermissions(await createAdminUser(['products.view']))
    const role = await createRole('Editors')

    const response = new UserPolicy().update(actor, target, { role, status: 'active' })

    assert.isFalse(response)
  })

  test('allows a staff editor to change another staff user', async ({ assert }) => {
    const actor = await withPermissions(await createAdminUser(['users.edit']))
    const target = await withPermissions(await createAdminUser(['products.view']))
    const role = await createRole('Editors')

    const response = new UserPolicy().update(actor, target, { role, status: 'inactive' })

    assert.isTrue(response)
  })

  test('only admins can assign the admin role', async ({ assert }) => {
    const admin = await withPermissions(await createAdminUser('admin'))
    const editor = await withPermissions(await createAdminUser(['users.edit']))
    const target = await withPermissions(await createAdminUser(['products.view']))
    const policy = new UserPolicy()

    assert.equal(
      denialMessage(policy.update(editor, target, { role: admin.role, status: 'active' })),
      'Only admins can assign the admin role'
    )
    assert.isTrue(policy.update(admin, target, { role: admin.role, status: 'active' }))
  })

  test('only admins can edit an admin', async ({ assert }) => {
    const editor = await withPermissions(await createAdminUser(['users.edit']))
    const target = await withPermissions(await createAdminUser('admin'))

    const response = new UserPolicy().update(editor, target, {
      role: target.role,
      status: 'active',
    })

    assert.equal(denialMessage(response), 'Only admins can edit an admin account')
  })

  test('blocks changing your own role or status but not keeping them', async ({ assert }) => {
    const actor = await withPermissions(await createAdminUser('admin'))
    const other = await createRole('Editors')
    const policy = new UserPolicy()

    assert.equal(
      denialMessage(policy.update(actor, actor, { role: other, status: 'active' })),
      "You can't change your own role"
    )
    assert.equal(
      denialMessage(policy.update(actor, actor, { role: actor.role, status: 'inactive' })),
      "You can't change your own status"
    )
    assert.isTrue(policy.update(actor, actor, { role: actor.role, status: 'active' }))
  })

  test('blocks assigning a role with permissions the actor lacks', async ({ assert }) => {
    const actor = await withPermissions(await createAdminUser(['users.edit']))
    const target = await withPermissions(await createAdminUser(['products.view']))
    const support = await createRole('Support', ['customers.view'])

    const response = new UserPolicy().update(actor, target, { role: support, status: 'active' })

    assert.equal(denialMessage(response), "You can't assign a role with permissions you don't have")
  })

  test('blocks non-admins from assigning a role with admin-only permissions', async ({
    assert,
  }) => {
    const actor = await withPermissions(await createAdminUser(['users.edit', 'roles.view']))
    const admin = await withPermissions(await createAdminUser('admin'))
    const target = await withPermissions(await createAdminUser(['products.view']))
    const roleManagers = await createRole('Role managers', ['roles.view'])
    const policy = new UserPolicy()

    assert.equal(
      denialMessage(policy.update(actor, target, { role: roleManagers, status: 'active' })),
      'Only admins can assign a role with user, role, or theme permissions'
    )
    assert.isTrue(policy.update(admin, target, { role: roleManagers, status: 'active' }))
  })

  test('allows assigning a role whose permissions the actor holds', async ({ assert }) => {
    const actor = await withPermissions(await createAdminUser(['users.edit', 'customers.view']))
    const target = await withPermissions(await createAdminUser(['products.view']))
    const support = await createRole('Support', ['customers.view'])

    const response = new UserPolicy().update(actor, target, { role: support, status: 'active' })

    assert.isTrue(response)
  })

  test('allows a profile save that keeps a role the actor could not assign', async ({ assert }) => {
    const actor = await withPermissions(await createAdminUser(['users.edit']))
    const target = await withPermissions(await createAdminUser(['customers.view']))

    const response = new UserPolicy().update(actor, target, {
      role: target.role,
      status: 'active',
    })

    assert.isTrue(response)
  })
})
