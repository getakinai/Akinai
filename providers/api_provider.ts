import { HttpContext } from '@adonisjs/core/http'
import { BaseSerializer } from '@adonisjs/core/transformers'
import { type SimplePaginatorMetaKeys } from '@adonisjs/lucid/types/querybuilder'

/**
 * Storefront catalog lists page with opaque cursors instead of page
 * numbers (see StorefrontCatalogTokenService).
 */
export type CursorPaginatorMetaKeys = { total: number; nextCursor: string | null }

function isCursorPaginatorMetaData(metaData: unknown): metaData is CursorPaginatorMetaKeys {
  if (typeof metaData !== 'object' || metaData === null) return false
  const { total, nextCursor } = metaData as Record<string, unknown>
  return typeof total === 'number' && (nextCursor === null || typeof nextCursor === 'string')
}

/**
 * Custom serializer for API responses that ensures consistent JSON structure
 * across all API endpoints. Wraps response data in a 'data' property and handles
 * pagination metadata for Lucid ORM query results and cursor-paginated lists.
 */
class ApiSerializer extends BaseSerializer<{
  Wrap: 'data'
  PaginationMetaData: SimplePaginatorMetaKeys | CursorPaginatorMetaKeys
}> {
  /**
   * Wraps all serialized data under this key in the response object.
   * Example: { data: [...] } instead of returning raw arrays/objects
   */
  wrap: 'data' = 'data'

  /**
   * Validates and defines pagination metadata structure for paginated responses.
   * Accepts Lucid's paginator metadata or the cursor shape used by the
   * storefront catalog.
   *
   * @throws Error if metadata matches neither structure
   */
  definePaginationMetaData(metaData: unknown): SimplePaginatorMetaKeys | CursorPaginatorMetaKeys {
    if (this.isLucidPaginatorMetaData(metaData) || isCursorPaginatorMetaData(metaData)) {
      return metaData
    }
    throw new Error(
      'Invalid pagination metadata. Expected Lucid pagination keys or { total, nextCursor }'
    )
  }
}

/**
 * Single instance of ApiSerializer used across the application
 */
const serializer = new ApiSerializer()
const serialize = Object.assign(
  function (this: HttpContext, ...[data, resolver]: Parameters<ApiSerializer['serialize']>) {
    return serializer.serialize(data, resolver ?? this.containerResolver)
  },
  {
    withoutWrapping(
      this: HttpContext,
      ...[data, resolver]: Parameters<ApiSerializer['serializeWithoutWrapping']>
    ) {
      return serializer.serializeWithoutWrapping(data, resolver ?? this.containerResolver)
    },
  }
) as ApiSerializer['serialize'] & { withoutWrapping: ApiSerializer['serializeWithoutWrapping'] }

/**
 * Adds the serialize method to all HttpContext instances.
 * Usage in controllers: return ctx.serialize(data)
 * This ensures all API responses follow the same structure with data wrapping.
 */
HttpContext.instanceProperty('serialize', serialize)

/**
 * Module augmentation to add the serialize method to HttpContext.
 * This allows controllers to use ctx.serialize() for consistent API responses.
 */
declare module '@adonisjs/core/http' {
  export interface HttpContext {
    serialize: typeof serialize
  }
}
