import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { AuthorizationResponse } from '@adonisjs/bouncer'
import type User from '#models/user'
import RolePolicy from '#policies/role_policy'
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

test.group('RolePolicy.editPermissions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('requires the roles.edit permission', async ({ assert }) => {
    const actor = await withPermissions(await createAdminUser(['roles.view']))
    const role = await createRole('Editors')
    const policy = await app.container.make(RolePolicy)

    const response = policy.editPermissions(actor, role, {
      permission: 'dashboard.view',
      granted: true,
    })

    assert.isFalse(response)
  })

  test("blocks edits to the actor's own role", async ({ assert }) => {
    const actor = await withPermissions(await createAdminUser(['roles.edit', 'dashboard.view']))
    const policy = await app.container.make(RolePolicy)

    const response = policy.editPermissions(actor, actor.role, {
      permission: 'dashboard.view',
      granted: true,
    })

    assert.equal(denialMessage(response), "You can't change your own role")
  })

  test('blocks granting a permission the actor does not hold', async ({ assert }) => {
    const actor = await withPermissions(await createAdminUser(['roles.edit', 'dashboard.view']))
    const role = await createRole('Editors')
    const policy = await app.container.make(RolePolicy)

    const response = policy.editPermissions(actor, role, {
      permission: 'customers.view',
      granted: true,
    })

    assert.equal(denialMessage(response), "You can't grant a permission you don't have")
  })

  test('blocks non-admins from granting admin-only permissions they hold', async ({ assert }) => {
    const actor = await withPermissions(await createAdminUser(['roles.edit', 'roles.view']))
    const role = await createRole('Editors')
    const policy = await app.container.make(RolePolicy)

    const response = policy.editPermissions(actor, role, {
      permission: 'roles.view',
      granted: true,
    })

    assert.equal(denialMessage(response), 'Only admins can grant this permission')
  })

  test('allows revoking a permission the actor does not hold', async ({ assert }) => {
    const actor = await withPermissions(await createAdminUser(['roles.edit']))
    const role = await createRole('Editors')
    const policy = await app.container.make(RolePolicy)

    const response = policy.editPermissions(actor, role, {
      permission: 'customers.view',
      granted: false,
    })

    assert.isTrue(response)
  })

  test('allows an admin to grant any permission on another role', async ({ assert }) => {
    const admin = await withPermissions(await createAdminUser('admin'))
    const role = await createRole('Editors')
    const policy = await app.container.make(RolePolicy)

    const response = policy.editPermissions(admin, role, {
      permission: 'themes.edit',
      granted: true,
    })

    assert.isTrue(response)
  })

  test('still refuses changes to the locked admin role', async ({ assert }) => {
    const admin = await withPermissions(await createAdminUser('admin'))
    const policy = await app.container.make(RolePolicy)

    const response = policy.editPermissions(admin, admin.role, {
      permission: 'themes.edit',
      granted: false,
    })

    assert.equal(denialMessage(response), 'The admin role always has every permission')
  })
})
