import env from '#start/env'
import { defineConfig, engines } from '@foadonis/magnify'
import type { InferEngines } from '@foadonis/magnify/types'
import { MemorySearchEngine } from '#search/memory_search_engine'

/**
 * Fields searched per index, most relevant first. Typesense uses the
 * order to weight matches; the memory engine mirrors it.
 */
const queryBy = {
  products: ['title', 'tags', 'description'],
}

const magnifyConfig = defineConfig({
  default: env.get('SEARCH_ENGINE', 'typesense'),
  engines: {
    typesense: engines.typesense({
      apiKey: env.get('TYPESENSE_API_KEY')?.release() ?? '',
      nodes: [{ url: env.get('TYPESENSE_NODE_URL', 'http://localhost:8108') }],
      connectionTimeoutSeconds: 2,
      numRetries: 1,
      collectionSettings: {
        products: {
          queryBy: queryBy.products,
          fields: [
            { name: 'title', type: 'string' },
            { name: 'tags', type: 'string[]', optional: true },
            { name: 'description', type: 'string', optional: true },
            { name: 'status', type: 'string', facet: true },
            { name: 'updatedAt', type: 'int64' },
          ],
        },
      },
    }),
    memory: () => new MemorySearchEngine(queryBy),
  },
})

export default magnifyConfig

/**
 * Inferring types for the list of engines you have configured
 * in your application.
 */
declare module '@foadonis/magnify/types' {
  export interface EnginesList extends InferEngines<typeof magnifyConfig> {}
}
