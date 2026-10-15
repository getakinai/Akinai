import type AdminEvent from '#models/admin_event'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `toObject` is the staff Events page (delivery status, details);
 * `toNotification` is the bell (needs the `read` extra from the query).
 */
export default class AdminEventTransformer extends BaseTransformer<AdminEvent> {
  protected summary() {
    return this.pick(this.resource, [
      'id',
      'type',
      'title',
      'subjectType',
      'subjectId',
      'subjectLabel',
      'orderId',
      'actorType',
      'actorLabel',
      'createdAt',
    ])
  }

  toObject() {
    return {
      ...this.summary(),
      ...this.pick(this.resource, [
        'channel',
        'details',
        'status',
        'attempts',
        'lastError',
        'deliveredAt',
      ]),
    }
  }

  toNotification() {
    return {
      ...this.summary(),
      read: Boolean(this.resource.$extras.read),
    }
  }
}
