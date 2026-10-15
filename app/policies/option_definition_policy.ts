import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type OptionDefinition from '#models/option_definition'
import type OptionDefinitionValue from '#models/option_definition_value'
import type User from '#models/user'

export default class OptionDefinitionPolicy extends BasePolicy {
  view(user: User): AuthorizerResponse {
    return user.hasPermission('options.view')
  }

  create(user: User): AuthorizerResponse {
    return user.hasPermission('options.create')
  }

  update(user: User, definition: OptionDefinition): AuthorizerResponse {
    if (!user.hasPermission('options.edit')) {
      return false
    }
    if (!definition.isActive) {
      return AuthorizationResponse.deny('Unarchive this option before editing it', 422)
    }
    return true
  }

  archive(user: User, definition: OptionDefinition): AuthorizerResponse {
    if (!user.hasPermission('options.archive')) {
      return false
    }
    if (!definition.isActive) {
      return AuthorizationResponse.deny('This option is already archived', 422)
    }
    return true
  }

  unarchive(user: User, definition: OptionDefinition): AuthorizerResponse {
    if (!user.hasPermission('options.archive')) {
      return false
    }
    if (definition.isActive) {
      return AuthorizationResponse.deny('This option is not archived', 422)
    }
    return true
  }

  createValue(user: User, definition: OptionDefinition): AuthorizerResponse {
    return this.update(user, definition)
  }

  updateValue(user: User, definition: OptionDefinition): AuthorizerResponse {
    return this.update(user, definition)
  }

  deleteValue(
    user: User,
    _value: OptionDefinitionValue,
    definition: OptionDefinition
  ): AuthorizerResponse {
    return this.update(user, definition)
  }
}
