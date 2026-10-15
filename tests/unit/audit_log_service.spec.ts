import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import AuditLog from '#models/audit_log'
import Customer from '#models/customer'
import CustomerAddress from '#models/customer_address'
import RolePermission from '#models/role_permission'
import { auditActor } from '#services/audit_actor'
import AuditLogService from '#services/audit_log_service'
import RoleService from '#services/role_service'
import { createAdminUser } from '#tests/helpers/admin'

async function createRole(name: string) {
  const roleService = await app.container.make(RoleService)
  return roleService.create({ name, description: null })
}

async function createCustomer() {
  return Customer.create({ fullName: 'Jane Customer', email: 'jane@example.com', phone: null })
}

test.group('Audit hooks and AuditLogService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('does not log without an actor', async ({ assert }) => {
    const role = await createRole('Editors')

    role.name = 'Writers'
    await role.save()
    await role.delete()

    assert.lengthOf(await AuditLog.query().where('auditable_id', role.id), 0)
  })

  test('logs updates and deletes made while an actor is set', async ({ assert }) => {
    const user = await createAdminUser('admin')
    const role = await createRole('Editors')

    await auditActor.run({ userId: user.id, ipAddress: '10.0.0.1' }, async () => {
      role.description = 'Writes things'
      await role.save()
      await role.delete()
    })

    const logs = await AuditLog.query().where('auditable_id', role.id).orderBy('created_at')
    assert.deepEqual(
      logs.map((log) => log.action),
      ['updated', 'deleted']
    )
    assert.deepEqual(logs[0].changes, {
      before: { description: null },
      after: { description: 'Writes things' },
    })
    assert.equal(logs[0].ipAddress, '10.0.0.1')
    assert.equal(logs[1].userId, user.id)
  })

  test('hides sensitive attributes', async ({ assert }) => {
    const actor = await createAdminUser('admin')
    const target = await createAdminUser('admin')

    await auditActor.run({ userId: actor.id, ipAddress: null }, async () => {
      target.password = 'new-password-123'
      target.fullName = 'Renamed'
      await target.save()
    })

    const [log] = await AuditLog.query().where('auditable_id', target.id)
    assert.equal(log.changes.before.password, '[hidden]')
    assert.equal(log.changes.after?.password, '[hidden]')
    assert.equal(log.changes.after?.fullName, 'Renamed')
  })

  test('does not audit audit logs', async ({ assert }) => {
    const user = await createAdminUser('admin')
    const role = await createRole('Editors')

    await auditActor.run({ userId: user.id, ipAddress: null }, async () => {
      role.name = 'Writers'
      await role.save()
      const [log] = await AuditLog.query().where('auditable_id', role.id)
      await log.delete()
    })

    assert.lengthOf(await AuditLog.all(), 0)
  })

  test('rolls the log back with the audited change', async ({ assert }) => {
    const user = await createAdminUser('admin')
    const role = await createRole('Editors')

    await auditActor.run({ userId: user.id, ipAddress: null }, async () => {
      const trx = await db.transaction()
      role.useTransaction(trx)
      role.name = 'Writers'
      await role.save()
      await trx.rollback()
    })

    assert.lengthOf(await AuditLog.query().where('auditable_id', role.id), 0)
  })

  test('diff skips timestamps and returns null when nothing else changed', async ({ assert }) => {
    const service = await app.container.make(AuditLogService)
    const role = await createRole('Editors')

    role.updatedAt = role.updatedAt?.plus({ minutes: 1 }) ?? null
    assert.isNull(service.diff(role, { hidden: [] }))

    role.name = 'Writers'
    assert.deepEqual(service.diff(role, { hidden: [] }), {
      before: { name: 'Editors' },
      after: { name: 'Writers' },
    })
  })

  test('names an address by its street and city and labels its customer', async ({ assert }) => {
    const user = await createAdminUser('admin')
    const customer = await createCustomer()
    const address = await CustomerAddress.create({
      customerId: customer.id,
      address1: '1 Cuba St',
      city: 'Wellington',
      countryCode: 'NZ',
      isDefault: false,
    })

    await auditActor.run({ userId: user.id, ipAddress: null }, async () => {
      await address.delete()
    })

    const [log] = await AuditLog.query().where('auditable_id', address.id)
    assert.equal(log.auditableLabel, '1 Cuba St, Wellington')
    assert.deepEqual(log.changes.labels, { customerId: { before: 'Jane Customer', after: null } })
  })

  test('a customer actor writes customer_id and no user_id', async ({ assert }) => {
    const customer = await createCustomer()
    const address = await CustomerAddress.create({
      customerId: customer.id,
      address1: '1 Cuba St',
      city: 'Wellington',
      countryCode: 'NZ',
      isDefault: false,
    })

    await auditActor.run(
      { userId: null, customerId: customer.id, ipAddress: '10.0.0.2' },
      async () => {
        address.city = 'Auckland'
        await address.save()
      }
    )

    const [log] = await AuditLog.query().where('auditable_id', address.id)
    assert.equal(log.customerId, customer.id)
    assert.isNull(log.userId)
    assert.equal(log.ipAddress, '10.0.0.2')
    assert.deepEqual(log.changes.after, { city: 'Auckland' })
  })

  test('recordBulkUpdate is a no-op for a customer actor', async ({ assert }) => {
    const service = await app.container.make(AuditLogService)
    const customer = await createCustomer()

    await auditActor.run({ userId: null, customerId: customer.id, ipAddress: null }, () =>
      service.recordBulkUpdate(Customer, [customer], { isActive: false })
    )

    assert.lengthOf(await AuditLog.all(), 0)
  })

  test('paginateForCustomer returns only that customer’s updates and deletes', async ({
    assert,
  }) => {
    const service = await app.container.make(AuditLogService)
    const user = await createAdminUser('admin')
    const customer = await createCustomer()
    const other = await Customer.create({
      fullName: 'Other',
      email: 'other@example.com',
      phone: null,
    })

    await auditActor.run({ userId: null, customerId: customer.id, ipAddress: null }, async () => {
      customer.phone = '021 111'
      await customer.save()
      customer.phone = '021 222'
      await customer.save()
    })
    await auditActor.run({ userId: null, customerId: other.id, ipAddress: null }, async () => {
      other.phone = '021 333'
      await other.save()
    })
    await auditActor.run({ userId: user.id, ipAddress: null }, async () => {
      customer.fullName = 'Staff edit'
      await customer.save()
    })
    await AuditLog.create({
      userId: null,
      customerId: customer.id,
      action: 'logged_in',
      auditableType: 'Customer',
      auditableId: customer.id,
      auditableLabel: null,
      changes: { before: {}, after: null },
      ipAddress: null,
    })

    const page = await service.paginateForCustomer(customer.id, { perPage: 10 })
    assert.deepEqual(
      page.all().map((log) => log.changes.after?.phone),
      ['021 222', '021 111']
    )
  })

  test('names a permission grant with its readable permission label', async ({ assert }) => {
    const user = await createAdminUser('admin')
    const roleService = await app.container.make(RoleService)
    const role = await createRole('Editors')
    await roleService.syncPermissions(role, ['inventory.edit'])
    const grant = await RolePermission.query().where('role_id', role.id).firstOrFail()

    await auditActor.run({ userId: user.id, ipAddress: null }, async () => {
      await grant.delete()
    })

    const [log] = await AuditLog.query().where('auditable_id', grant.id)
    assert.equal(log.auditableLabel, 'Inventory: Edit')
  })

  test('labels a cleared reference as null', async ({ assert }) => {
    const user = await createAdminUser('admin')
    const target = await createAdminUser('admin')

    await auditActor.run({ userId: user.id, ipAddress: null }, async () => {
      target.roleId = null
      await target.save()
    })

    const [log] = await AuditLog.query().where('auditable_id', target.id)
    assert.deepEqual(log.changes.labels, { roleId: { before: 'Admin', after: null } })
  })

  test('record is a no-op outside a staff request', async ({ assert }) => {
    const service = await app.container.make(AuditLogService)
    const role = await createRole('Editors')

    const log = await service.record(role, 'deleted', service.snapshot(role, { hidden: [] }))

    assert.isNull(log)
  })

  test('paginateForUser returns the newest logs first', async ({ assert }) => {
    const service = await app.container.make(AuditLogService)
    const user = await createAdminUser('admin')
    const role = await createRole('Editors')

    await auditActor.run({ userId: user.id, ipAddress: null }, async () => {
      role.name = 'Writers'
      await role.save()
      role.name = 'Authors'
      await role.save()
    })

    const page = await service.paginateForUser(user.id, { perPage: 15 })
    assert.deepEqual(
      page.all().map((log) => log.changes.after?.name),
      ['Authors', 'Writers']
    )
  })
})
