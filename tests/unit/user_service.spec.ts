import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import RoleService from '#services/role_service'
import UserService from '#services/user_service'

async function services() {
  return {
    roleService: await app.container.make(RoleService),
    userService: await app.container.make(UserService),
  }
}

test.group('UserService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('create falls back to the default role and loads it', async ({ assert }) => {
    const { roleService, userService } = await services()
    const fallback =
      (await roleService.findDefault()) ??
      (await roleService.ensure(
        { slug: 'staff', name: 'Staff', description: 'Default', isDefault: true, sortOrder: 1 },
        []
      ))

    const user = await userService.create({
      fullName: null,
      email: 'New@Example.com',
      password: 'password123',
    })

    assert.equal(user.email, 'new@example.com')
    assert.equal(user.status, 'active')
    assert.equal(user.roleId, fallback.id)
    assert.equal(user.role.id, fallback.id)
  })

  test('findDetail preloads the role', async ({ assert }) => {
    const { roleService, userService } = await services()
    const role = await roleService.create({ name: 'Editors', description: null })
    const user = await userService.create({
      fullName: 'Jane',
      email: 'jane@example.com',
      password: 'password123',
      roleId: role.id,
    })

    const detail = await userService.findDetail(user.id)

    assert.equal(detail.role.name, 'Editors')
  })

  test('update lowercases the email and reloads the new role', async ({ assert }) => {
    const { roleService, userService } = await services()
    const editors = await roleService.create({ name: 'Editors', description: null })
    const viewers = await roleService.create({ name: 'Viewers', description: null })
    const user = await userService.create({
      fullName: 'Jane',
      email: 'jane@example.com',
      password: 'password123',
      roleId: editors.id,
    })

    const updated = await userService.update(user, {
      fullName: 'Jane Doe',
      email: 'Jane.Doe@Example.com',
      status: 'pending',
      roleId: viewers.id,
    })

    assert.equal(updated.email, 'jane.doe@example.com')
    assert.equal(updated.fullName, 'Jane Doe')
    assert.equal(updated.status, 'pending')
    assert.equal(updated.role.id, viewers.id)
  })

  test('paginate filters by role and status', async ({ assert }) => {
    const { roleService, userService } = await services()
    const editors = await roleService.create({ name: 'Editors', description: null })
    const viewers = await roleService.create({ name: 'Viewers', description: null })
    const base = { fullName: null, password: 'password123' }
    await userService.create({ ...base, email: 'a@example.com', roleId: editors.id })
    await userService.create({
      ...base,
      email: 'b@example.com',
      roleId: editors.id,
      status: 'inactive',
    })
    await userService.create({ ...base, email: 'c@example.com', roleId: viewers.id })

    const byRole = await userService.paginate({ roleId: editors.id })
    const byRoleAndStatus = await userService.paginate({ roleId: editors.id, status: 'inactive' })

    assert.sameMembers(
      byRole.all().map((user) => user.email),
      ['a@example.com', 'b@example.com']
    )
    assert.deepEqual(
      byRoleAndStatus.all().map((user) => user.email),
      ['b@example.com']
    )
    assert.equal(byRole.all()[0].role.id, editors.id)
  })
})
