const engines = new Map<string, unknown>()

export function registerThemeEngine(key: string, engine: unknown) {
  engines.set(key, engine)
}

export function getThemeEngine(key: string): unknown | undefined {
  return engines.get(key)
}

export function invalidateThemeEngine(cacheKey: string) {
  engines.delete(cacheKey)
}
