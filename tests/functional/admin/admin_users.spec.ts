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

async function adminRole() {
  const roleService = await app.container.make(RoleService)
  return roleService.ensure(
    { slug: 'admin', name: 'Admin', description: 'Full access', isLocked: true, sortOrder: 0 },
    []
  )
}

async function createStaff(email: string, roleId: string) {
  const userService = await app.container.make(UserService)
  return userService.create({ fullName: 'Jane Staff', email, password: 'password123', roleId })
}

test.group('Staff users: list', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('includes each user role', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const editors = await createRole('Editors')
    await createStaff('jane@example.com', editors.id)

    const response = await client
      .get('/admin/users/list')
      .qs({ q: 'jane@example.com' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const [row] = response.body().data
    assert.equal(row.roleId, editors.id)
    assert.deepEqual(row.role, {
      id: editors.id,
      name: 'Editors',
      slug: 'editors',
      isLocked: false,
    })
  })

  test('filters by role', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const editors = await createRole('Editors')
    const viewers = await createRole('Viewers')
    await createStaff('editor@example.com', editors.id)
    await createStaff('viewer@example.com', viewers.id)

    const response = await client
      .get('/admin/users/list')
      .qs({ roleId: viewers.id })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.map((row: { email: string }) => row.email),
      ['viewer@example.com']
    )
  })

  test('rejects a role filter that is not a UUID', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .get('/admin/users/list')
      .qs({ roleId: 'admin' })
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'roleId' }] })
  })

  test('requires the users.view permission', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get('/admin/users/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff users: view and role options', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns a user with their role', async ({ client }) => {
    const user = await createAdminUser(['users.view'])
    const editors = await createRole('Editors')
    const staff = await createStaff('jane@example.com', editors.id)

    const response = await client
      .get(`/admin/users/view/${staff.id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        id: staff.id,
        email: 'jane@example.com',
        fullName: 'Jane Staff',
        status: 'active',
        role: { id: editors.id, name: 'Editors', isLocked: false },
      },
    })
  })

  test('does not expose the password hash', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .get(`/admin/users/view/${user.id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.notProperty(response.body().data, 'password')
  })

  test('returns 404 for an unknown user', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .get('/admin/users/view/0190a6f1-0000-7000-8000-000000000000')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })

  test('requires the users.view permission to view a user', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get(`/admin/users/view/${user.id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('lists role options for the role picker', async ({ client, assert }) => {
    const user = await createAdminUser(['users.view'])
    const editors = await createRole('Editors')

    const response = await client
      .get('/admin/users/roles')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const option = response.body().data.find((role: { id: string }) => role.id === editors.id)
    assert.deepEqual(option, {
      id: editors.id,
      name: 'Editors',
      slug: 'editors',
      isLocked: false,
      isDefault: false,
      permissions: [],
    })
  })

  test('requires the users.view permission for role options', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get('/admin/users/roles')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('requires the users.edit permission for the edit page', async ({ client }) => {
    const user = await createAdminUser(['users.view'])

    const response = await client
      .get(`/admin/users/edit/${user.id}`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff users: update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('updates the profile, role and status', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const editors = await createRole('Editors')
    const viewers = await createRole('Viewers')
    const staff = await createStaff('jane@example.com', editors.id)

    const response = await client
      .put(`/admin/users/${staff.id}`)
      .json({
        fullName: 'Jane Doe',
        email: 'JANE.DOE@Example.com',
        status: 'inactive',
        roleId: viewers.id,
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        status: 'inactive',
        roleId: viewers.id,
        role: { id: viewers.id, name: 'Viewers' },
      },
    })

    await staff.refresh()
    assert.equal(staff.roleId, viewers.id)
    assert.equal(staff.status, 'inactive')
  })

  test('allows keeping the same email', async ({ client }) => {
    const user = await createAdminUser('admin')
    const editors = await createRole('Editors')
    const staff = await createStaff('jane@example.com', editors.id)

    const response = await client
      .put(`/admin/users/${staff.id}`)
      .json({ fullName: null, email: 'jane@example.com', status: 'active', roleId: editors.id })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: { fullName: null, email: 'jane@example.com' } })
  })

  test('rejects an email used by another user', async ({ client }) => {
    const user = await createAdminUser('admin')
    const editors = await createRole('Editors')
    const staff = await createStaff('jane@example.com', editors.id)
    await createStaff('taken@example.com', editors.id)

    const response = await client
      .put(`/admin/users/${staff.id}`)
      .json({ fullName: null, email: 'TAKEN@example.com', status: 'active', roleId: editors.id })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'email' }] })
  })

  test('validates the status and role', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const editors = await createRole('Editors')
    const staff = await createStaff('jane@example.com', editors.id)

    const response = await client
      .put(`/admin/users/${staff.id}`)
      .json({
        fullName: null,
        email: 'not-an-email',
        status: 'banned',
        roleId: '0190a6f1-0000-7000-8000-000000000000',
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    const fields = response.body().errors.map((error: { field: string }) => error.field)
    assert.includeMembers(fields, ['email', 'status', 'roleId'])
  })

  test('requires the users.edit permission', async ({ client }) => {
    const user = await createAdminUser(['users.view'])
    const editors = await createRole('Editors')
    const staff = await createStaff('jane@example.com', editors.id)

    const response = await client
      .put(`/admin/users/${staff.id}`)
      .json({ fullName: null, email: 'jane@example.com', status: 'active', roleId: editors.id })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('lets an admin assign the admin role', async ({ client }) => {
    const user = await createAdminUser('admin')
    const editors = await createRole('Editors')
    const admin = await adminRole()
    const staff = await createStaff('jane@example.com', editors.id)

    const response = await client
      .put(`/admin/users/${staff.id}`)
      .json({ fullName: null, email: 'jane@example.com', status: 'active', roleId: admin.id })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: { role: { id: admin.id, isLocked: true } } })
  })

  test('stops non-admins from assigning the admin role', async ({ client }) => {
    const user = await createAdminUser(['users.view', 'users.edit'])
    const editors = await createRole('Editors')
    const admin = await adminRole()
    const staff = await createStaff('jane@example.com', editors.id)

    const response = await client
      .put(`/admin/users/${staff.id}`)
      .json({ fullName: null, email: 'jane@example.com', status: 'active', roleId: admin.id })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ message: 'Only admins can assign the admin role' }] })
  })

  test('stops non-admins from editing an admin', async ({ client }) => {
    const user = await createAdminUser(['users.view', 'users.edit'])
    const target = await createAdminUser('admin')
    const editors = await createRole('Editors')

    const response = await client
      .put(`/admin/users/${target.id}`)
      .json({ fullName: 'Renamed', email: target.email, status: 'active', roleId: editors.id })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ message: 'Only admins can edit an admin account' }] })
  })

  test('stops users from changing their own role', async ({ client }) => {
    const user = await createAdminUser('admin')
    const editors = await createRole('Editors')

    const response = await client
      .put(`/admin/users/${user.id}`)
      .json({ fullName: null, email: user.email, status: 'active', roleId: editors.id })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ message: "You can't change your own role" }] })
  })

  test('stops users from changing their own status', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .put(`/admin/users/${user.id}`)
      .json({ fullName: null, email: user.email, status: 'inactive', roleId: user.roleId })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ message: "You can't change your own status" }] })
  })

  test('lets users edit their own name and email', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .put(`/admin/users/${user.id}`)
      .json({
        fullName: 'Me Myself',
        email: 'me@example.com',
        status: 'active',
        roleId: user.roleId,
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: { fullName: 'Me Myself', email: 'me@example.com' } })
  })
})
