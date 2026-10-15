import { SimplePaginator } from '@adonisjs/lucid/database'
import { MagnifyEngine, type Builder } from '@foadonis/magnify'
import type { SearchableModel, SearchableRow } from '@foadonis/magnify/types'

type Document = Record<string, unknown>

type MemorySearchResults = { hits: Document[]; found: number }

/**
 * In-process Magnify engine used by the test suite (`SEARCH_ENGINE=memory`).
 * Matches every query token case-insensitively against `queryBy` fields,
 * ranking earlier fields higher, and applies `where` / `whereIn` filters.
 */
export class MemorySearchEngine extends MagnifyEngine {
  #indexes = new Map<string, Map<string, Document>>()

  constructor(protected queryBy: Record<string, string[]>) {
    super()
  }

  #index(name: string) {
    let index = this.#indexes.get(name)
    if (!index) {
      index = new Map()
      this.#indexes.set(name, index)
    }
    return index
  }

  documents(model: SearchableModel): Document[] {
    return [...this.#index(model.$searchIndex).values()]
  }

  reset() {
    this.#indexes.clear()
  }

  async update(...models: SearchableRow[]): Promise<void> {
    if (models.length === 0) return
    const Static = models[0].constructor as unknown as SearchableModel
    const index = this.#index(Static.$searchIndex)
    for (const model of models) {
      const key = model.$searchKeyValue.toString()
      index.set(key, { ...model.toSearchableObject(), [Static.$searchKey]: key })
    }
  }

  async delete(...models: SearchableRow[]): Promise<void> {
    if (models.length === 0) return
    const Static = models[0].constructor as unknown as SearchableModel
    const index = this.#index(Static.$searchIndex)
    for (const model of models) index.delete(model.$searchKeyValue.toString())
  }

  async flush(model: SearchableModel): Promise<void> {
    this.#index(model.$searchIndex).clear()
  }

  async search(builder: Builder): Promise<MemorySearchResults> {
    const fields = this.queryBy[builder.$model.$searchIndex] ?? []
    const tokens = builder.$query.toLowerCase().split(/\s+/).filter(Boolean)

    const scored = this.documents(builder.$model)
      .filter((doc) => this.#matchesFilters(builder, doc))
      .map((doc) => ({ doc, score: this.#score(fields, tokens, doc) }))
      .filter(({ score }) => tokens.length === 0 || score > 0)
      .sort((a, b) => b.score - a.score)

    return { hits: scored.map(({ doc }) => doc), found: scored.length }
  }

  async map(builder: Builder, results: MemorySearchResults): Promise<unknown[]> {
    if (results.found === 0) return []
    const ids = results.hits.map((doc) => String(doc[builder.$model.$searchKey]))
    return builder.$model.$queryMagnifyModelsByIds(builder, ...ids)
  }

  async paginate(builder: Builder, perPage: number, page: number): Promise<SimplePaginator> {
    const results = await this.search(builder)
    const start = (page - 1) * perPage
    const pageHits = results.hits.slice(start, start + perPage)
    const rows = await this.map(builder, { hits: pageHits, found: pageHits.length })
    return new SimplePaginator(results.found, perPage, page, ...rows)
  }

  #matchesFilters(builder: Builder, doc: Document) {
    const wheres = Object.entries(builder.$wheres).every(([key, value]) => doc[key] === value)
    const whereIns = Object.entries(builder.$whereIns).every(([key, values]) =>
      values.includes(doc[key])
    )
    const whereNotIns = Object.entries(builder.$whereNotIns).every(
      ([key, values]) => !values.includes(doc[key])
    )
    return wheres && whereIns && whereNotIns
  }

  #score(fields: string[], tokens: string[], doc: Document) {
    let total = 0
    for (const token of tokens) {
      const weights = fields.map((field, position) => {
        const value = doc[field]
        const text = (Array.isArray(value) ? value.join(' ') : String(value ?? '')).toLowerCase()
        return text.includes(token) ? fields.length - position : 0
      })
      const best = Math.max(0, ...weights)
      if (best === 0) return 0
      total += best
    }
    return total
  }
}
