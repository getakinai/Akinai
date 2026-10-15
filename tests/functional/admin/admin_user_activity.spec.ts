import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import AuditLog from '#models/audit_log'
import type User from '#models/user'
import RoleService from '#services/role_service'
import { createAdminUser } from '#tests/helpers/admin'

async function createRole(name: string) {
  const roleService = await app.container.make(RoleService)
  return roleService.create({ name, description: null })
}

test.group('Audit logs: recorded actions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('logs an update with only the changed attributes', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const role = await createRole('Editors')

    const response = await client
      .put(`/admin/roles/${role.id}`)
      .json({ name: 'Writers', description: null })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    response.assertStatus(200)

    const [log] = await AuditLog.query().where('auditable_id', role.id)
    assert.equal(log.userId, user.id)
    assert.equal(log.action, 'updated')
    assert.equal(log.auditableType, 'Role')
    assert.equal(log.auditableLabel, 'Editors')
    assert.isNotNull(log.ipAddress)
    assert.deepEqual(log.changes, {
      before: { name: 'Editors', slug: 'editors' },
      after: { name: 'Writers', slug: 'writers' },
    })
  })

  test('does not log a save that changes nothing', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const role = await createRole('Editors')

    const response = await client
      .put(`/admin/roles/${role.id}`)
      .json({ name: 'Editors', description: null })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    response.assertStatus(200)

    assert.lengthOf(await AuditLog.query().where('auditable_id', role.id), 0)
  })

  test('logs a delete with a snapshot of the record', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const role = await createRole('Editors')

    const response = await client
      .delete(`/admin/roles/${role.id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    response.assertStatus(204)

    const [log] = await AuditLog.query().where('auditable_id', role.id)
    assert.equal(log.action, 'deleted')
    assert.equal(log.auditableLabel, 'Editors')
    assert.isNull(log.changes.after)
    assert.containsSubset(log.changes.before, { name: 'Editors', slug: 'editors' })
    assert.notProperty(log.changes.before, 'id')
    assert.notProperty(log.changes.before, 'createdAt')
  })

  test('logs a permission revoke', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const roleService = await app.container.make(RoleService)
    const role = await createRole('Editors')
    await roleService.syncPermissions(role, ['products.view'])

    const response = await client
      .put(`/admin/roles/${role.id}/permissions`)
      .json({ permission: 'products.view', granted: false })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    response.assertStatus(200)

    const [log] = await AuditLog.query()
      .where('auditable_type', 'RolePermission')
      .where('user_id', user.id)
    assert.equal(log.action, 'deleted')
    assert.equal(log.auditableLabel, 'Products: View')
    assert.deepEqual(log.changes.labels, { roleId: { before: 'Editors', after: null } })
  })

  test('names changed references instead of storing only ids', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const editors = await createRole('Editors')
    const viewers = await createRole('Viewers')
    const target = await createAdminUser(['products.view'])
    target.roleId = editors.id
    await target.save()

    const response = await client
      .put(`/admin/users/${target.id}`)
      .json({
        fullName: target.fullName,
        email: target.email,
        status: 'active',
        roleId: viewers.id,
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    response.assertStatus(200)

    const [log] = await AuditLog.query().where('auditable_id', target.id)
    assert.deepEqual(log.changes.before, { roleId: editors.id })
    assert.deepEqual(log.changes.after, { roleId: viewers.id })
    assert.deepEqual(log.changes.labels, { roleId: { before: 'Editors', after: 'Viewers' } })
    assert.equal(log.auditableLabel, target.fullName)
  })

  test('does not log creates', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/roles')
      .json({ name: 'Editors', description: null })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    response.assertStatus(201)

    assert.lengthOf(await AuditLog.query().where('user_id', user.id), 0)
  })

  test('does not log changes rejected by validation', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const role = await createRole('Editors')

    const response = await client
      .put(`/admin/roles/${role.id}`)
      .json({ name: '', description: null })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    response.assertStatus(422)

    assert.lengthOf(await AuditLog.query().where('auditable_id', role.id), 0)
  })
})

test.group('Audit logs: sign-ins', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('logs a successful sign-in', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/login')
      .json({ email: user.email, password: 'password123' })
      .accept('json')
      .withCsrfToken()
    response.assertStatus(200)

    const logs = await AuditLog.query().where('user_id', user.id)
    assert.lengthOf(logs, 1)
    assert.containsSubset(logs[0].serialize(), {
      action: 'logged_in',
      auditableType: 'User',
      auditableId: user.id,
      auditableLabel: user.fullName,
      changes: { before: {}, after: null },
    })
    assert.isNotNull(logs[0].ipAddress)
  })

  test('logs a failed sign-in as a security event', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/login')
      .json({ email: user.email, password: 'wrong-password' })
      .accept('json')
      .withCsrfToken()
    response.assertStatus(400)

    const logs = await AuditLog.query().where('user_id', user.id)
    assert.lengthOf(logs, 1)
    assert.containsSubset(logs[0].serialize(), {
      action: 'login_failed',
      auditableType: 'User',
      auditableId: user.id,
    })
    assert.isNotNull(logs[0].ipAddress)
  })

  test('does not log a sign-in blocked for a deactivated user', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    user.status = 'inactive'
    await user.save()

    const response = await client
      .post('/admin/login')
      .json({ email: user.email, password: 'password123' })
      .accept('json')
      .withCsrfToken()
    response.assertStatus(400)

    assert.lengthOf(await AuditLog.query().where('user_id', user.id), 0)
  })

  test('shows sign-ins in the user activity', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await client
      .post('/admin/login')
      .json({ email: user.email, password: 'password123' })
      .accept('json')
      .withCsrfToken()

    const response = await client
      .get(`/admin/users/${user.id}/activity`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.map((log: { action: string }) => log.action),
      ['logged_in']
    )
  })
})

test.group('Audit logs: user activity list', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function renameRole(client: ApiClient, user: User, roleId: string, name: string) {
    const response = await client
      .put(`/admin/roles/${roleId}`)
      .json({ name, description: null })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    response.assertStatus(200)
  }

  test('lists the actions a user took, newest first', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const role = await createRole('Editors')
    await renameRole(client, user, role.id, 'Writers')
    await renameRole(client, user, role.id, 'Authors')

    const response = await client
      .get(`/admin/users/${user.id}/activity`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.metadata.total, 2)
    assert.deepEqual(
      body.data.map((log: { changes: { after: { name: string } } }) => log.changes.after.name),
      ['Authors', 'Writers']
    )
    assert.containsSubset(body.data[0], {
      action: 'updated',
      auditableType: 'Role',
      auditableId: role.id,
      auditableLabel: 'Writers',
    })
  })

  test('only includes the requested user activity', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const other = await createAdminUser('admin')
    const role = await createRole('Editors')
    await renameRole(client, other, role.id, 'Writers')

    const response = await client
      .get(`/admin/users/${user.id}/activity`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 0)
  })

  test('paginates', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const role = await createRole('Role 0')
    for (let index = 1; index <= 16; index++) {
      await renameRole(client, user, role.id, `Role ${index}`)
    }

    const response = await client
      .get(`/admin/users/${user.id}/activity`)
      .qs({ page: 2, perPage: 15 })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.containsSubset(response.body().metadata, { total: 16, currentPage: 2, lastPage: 2 })
  })

  test('rejects an unsupported page size', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .get(`/admin/users/${user.id}/activity`)
      .qs({ perPage: 7 })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'perPage' }] })
  })

  test('returns 404 for an unknown user', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .get('/admin/users/0190a6f1-0000-7000-8000-000000000000/activity')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })

  test('requires the users.view permission', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get(`/admin/users/${user.id}/activity`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})
