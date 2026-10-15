import { configApp } from '@adonisjs/eslint-config'
import { react } from '@adonisjs/eslint-config/react'

export default configApp({ ignores: ['.mockups/**'] }, ...react, {
  files: ['app/**/*.ts'],
  languageOptions: {
    parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
  },
  rules: {
    '@typescript-eslint/no-floating-promises': [
      'error',
      {
        // Lucid query builders extend Promise but are only executed when awaited.
        allowForKnownSafePromises: [
          {
            from: 'package',
            package: '@adonisjs/lucid',
            name: [
              'DatabaseQueryBuilderContract',
              'ModelQueryBuilderContract',
              'InsertQueryBuilderContract',
              'RawQueryBuilderContract',
              'RawBuilderContract',
              'ReferenceBuilderContract',
              'ExcutableQueryBuilderContract',
              'ChainableContract',
              'RelationQueryBuilderContract',
              'HasManyQueryBuilderContract',
              'ManyToManyQueryBuilderContract',
              'BelongsToQueryBuilderContract',
              'HasManyThroughQueryBuilderContract',
              'RelationSubQueryBuilderContract',
              'ManyToManySubQueryBuilderContract',
              'LazyLoadAggregatesContract',
            ],
          },
        ],
      },
    ],
  },
})
