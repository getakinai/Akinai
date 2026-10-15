import User, { type UserStatus } from '#models/user'
import { containsPattern } from '#repositories/helpers/like'

export type CreateUserData = {
  fullName: string | null
  email: string
  password: string
  roleId: string | null
  status: UserStatus
}

export type UpdateUserData = {
  fullName: string | null
  email: string
  roleId: string
  status: UserStatus
}

export type UserSortKey = 'fullName' | 'email' | 'createdAt'

export type PaginateUsersData = {
  q?: string
  status?: UserStatus
  roleId?: string
  sort: UserSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<UserSortKey, string> = {
  fullName: 'full_name',
  email: 'email',
  createdAt: 'created_at',
}

export default class UserRepository {
  async verifyCredentials(email: string, password: string): Promise<User> {
    return User.verifyCredentials(email, password)
  }

  async create(data: CreateUserData): Promise<User> {
    return User.create(data)
  }

  async findByEmail(email: string): Promise<User | null> {
    return User.findBy('email', email)
  }

  async find(id: string): Promise<User | null> {
    return User.find(id)
  }

  async findOrFail(id: string): Promise<User> {
    return User.findOrFail(id)
  }

  async findWithRoleOrFail(id: string): Promise<User> {
    return User.query().where('id', id).preload('role').firstOrFail()
  }

  async loadRole(user: User): Promise<User> {
    await user.load('role')
    return user
  }

  async update(user: User, data: Partial<UpdateUserData>): Promise<User> {
    return user.merge(data).save()
  }

  /**
   * Sets a new password (hashed by the model) and bumps `sessionVersion`,
   * which signs out every other session. The caller records the
   * `password_changed` event, so the generic `updated` entry is skipped.
   */
  async changePassword(user: User, password: string): Promise<User> {
    user.$skipAudit = true
    return user.merge({ password, sessionVersion: user.sessionVersion + 1 }).save()
  }

  async paginate({ q, status, roleId, sort, direction, page, perPage }: PaginateUsersData) {
    return User.query()
      .preload('role')
      .if(q, (query) => {
        query.where((group) => {
          group
            .whereILike('full_name', containsPattern(q))
            .orWhereILike('email', containsPattern(q))
        })
      })
      .if(status, (query) => query.where('status', status!))
      .if(roleId, (query) => query.where('role_id', roleId!))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }
}
