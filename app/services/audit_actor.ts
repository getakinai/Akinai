import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Who is making changes: a staff User (`userId`) on back-office routes, or
 * a storefront Customer (`customerId`) on their own account routes.
 */
export type AuditActor = {
  userId: string | null
  customerId?: string | null
  ipAddress: string | null
}

const storage = new AsyncLocalStorage<AuditActor>()

/**
 * The actor whose request is running. Set by AuditActorMiddleware on
 * back-office routes and CustomerAuditActorMiddleware on `/account`
 * routes; model audit hooks only log while an actor is set.
 */
export const auditActor = {
  run<T>(actor: AuditActor, callback: () => T): T {
    return storage.run(actor, callback)
  },

  current(): AuditActor | undefined {
    return storage.getStore()
  },
}
