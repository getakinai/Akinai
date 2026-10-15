import type { BaseCommand } from '@adonisjs/core/ace'

/**
 * Ace commands that write data and have no production guard of their own
 * (Lucid only guards migrations and db:truncate/db:wipe with --force).
 */
export const PRODUCTION_GUARDED_COMMANDS = ['db:seed', 'seed:demo-store'] as const

/**
 * One-off bypass for non-interactive runs. The value must be the command
 * name, so it never unlocks a different command. Set it on the command
 * line only; putting it in .env would disable the guard for good.
 */
export const PRODUCTION_CONFIRM_ENV = 'CONFIRM_PRODUCTION_COMMAND'

export class ProductionCommandRefusedError extends Error {}

export function requiresProductionConfirmation(commandName: string, inProduction: boolean) {
  return inProduction && (PRODUCTION_GUARDED_COMMANDS as readonly string[]).includes(commandName)
}

type GuardOptions = {
  inProduction: boolean
  env?: NodeJS.ProcessEnv
  interactive?: boolean
}

/**
 * Asks for confirmation before a guarded command runs in production, and
 * refuses when nobody can answer (no TTY) unless the bypass is set.
 */
export async function guardProductionCommand(
  command: BaseCommand,
  { inProduction, env = process.env, interactive = Boolean(process.stdin.isTTY) }: GuardOptions
) {
  const commandName = (command.constructor as typeof BaseCommand).commandName
  if (!requiresProductionConfirmation(commandName, inProduction)) return

  if (env[PRODUCTION_CONFIRM_ENV] === commandName) {
    command.logger.warning(`Running "${commandName}" in production (${PRODUCTION_CONFIRM_ENV} set)`)
    return
  }

  if (!interactive) {
    throw new ProductionCommandRefusedError(
      `Refusing to run "${commandName}" in production without confirmation. ` +
        `Run it in an interactive terminal (docker exec -it ...) or set ` +
        `${PRODUCTION_CONFIRM_ENV}=${commandName}.`
    )
  }

  const confirmed = await command.prompt.confirm(
    `You are about to run "${commandName}" against the PRODUCTION database. Continue?`,
    { default: false }
  )
  if (!confirmed) {
    throw new ProductionCommandRefusedError(`Cancelled "${commandName}" in production`)
  }
}
