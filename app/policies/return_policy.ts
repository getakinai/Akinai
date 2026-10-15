import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type OrderReturn from '#models/order_return'
import type User from '#models/user'

/** State checks run again under a row lock in ReturnRepository. */
export default class ReturnPolicy extends BasePolicy {
  approve(user: User, ret: OrderReturn): AuthorizerResponse {
    return this.inStatus(user, ret, ['requested'], 'Only requested returns can be approved')
  }

  decline(user: User, ret: OrderReturn): AuthorizerResponse {
    return this.inStatus(user, ret, ['requested'], 'Only requested returns can be declined')
  }

  receive(user: User, ret: OrderReturn): AuthorizerResponse {
    return this.inStatus(user, ret, ['approved'], 'Approve the return before receiving it')
  }

  cancel(user: User, ret: OrderReturn): AuthorizerResponse {
    return this.inStatus(
      user,
      ret,
      ['requested', 'approved'],
      'Only open returns that haven’t been received can be cancelled'
    )
  }

  protected inStatus(
    user: User,
    ret: OrderReturn,
    statuses: OrderReturn['status'][],
    message: string
  ): AuthorizerResponse {
    if (!user.hasPermission('orders.edit')) {
      return false
    }
    if (!statuses.includes(ret.status)) {
      return AuthorizationResponse.deny(message, 422)
    }
    return true
  }
}
