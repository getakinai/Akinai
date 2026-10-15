import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { AuthorizationResponse } from '@adonisjs/bouncer'
import type User from '#models/user'
import UserPolicy from '#policies/user_policy'
import RoleService from '#services/role_service'
import UserService from '#services/user_service'
import { createAdminUser } from '#tests/helpers/admin'

async function withPermissions(user: User) {
  const userService = await app.container.make(UserService)
  return userService.loadRole(user)
}

async function createRole(name: string) {
  const roleService = await app.container.make(RoleService)
  return roleService.create({ name, description: null })
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
})
