import { readFileSync } from 'node:fs'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'
import { pluginMigrationPaths } from '#plugin_host/migration_paths'

const caPath = env.get('DB_SSL_CA_PATH')

const ssl = env.get('DB_SSL')
  ? {
      rejectUnauthorized: env.get('DB_SSL_REJECT_UNAUTHORIZED', true),
      ...(caPath ? { ca: readFileSync(caPath, 'utf8') } : {}),
    }
  : false

const dbConfig = defineConfig({
  /**
   * Default connection used for all queries.
   */
  connection: 'pg',

  connections: {
    /**
     * PostgreSQL connection (default).
     */
    pg: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD')?.release(),
        database: env.get('DB_DATABASE'),
        ssl,
      },

      migrations: {
        /**
         * Sort migration files naturally by filename.
         */
        naturalSort: true,

        /**
         * Paths containing migration files.
         */
        paths: ['database/migrations', ...pluginMigrationPaths()],
      },

      /**
       * Disabled because generated schema classes extend BaseModel directly.
       * Models extend BaseAppModel (UUID primary keys) and declare columns by hand.
       */
      schemaGeneration: {
        enabled: false,
      },

      debug: app.inDev,
    },
  },
})

export default dbConfig
