/**
 * Placeholder values for columns the users table doesn't store yet
 * (department, last active, display id). Derived from the user id so
 * each row is stable across renders. Replace with real fields next pass.
 */

const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'Operations', 'Finance']

function hash(value: string) {
  let result = 0
  for (const char of value) result = (result * 31 + char.charCodeAt(0)) >>> 0
  return result
}

export type MockUserExtras = {
  department: string
  displayId: string
  lastActive: Date
}

export function mockUserExtras({ id, createdAt }: { id: string; createdAt: string }) {
  const seed = hash(id)
  const extras: MockUserExtras = {
    department: departments[(seed >>> 6) % departments.length],
    displayId: `USR-${1000 + (seed % 9000)}`,
    lastActive: new Date(new Date(createdAt).getTime() + (seed % (14 * 24 * 60)) * 60_000),
  }
  return extras
}
