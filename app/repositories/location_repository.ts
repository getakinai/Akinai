import db from '@adonisjs/lucid/services/db'
import Location from '#models/location'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'
import { lowerIn } from '#repositories/helpers/lower_in'

export type LocationData = {
  name: string
  addressLine: string | null
  city: string | null
  country: string | null
}

export type CreateLocationData = LocationData & {
  isActive?: boolean
  isDefault?: boolean
}

export type LocationSortKey = 'name' | 'createdAt'

export type LocationStatusFilter = 'active' | 'archived'

export type PaginateLocationsData = {
  q?: string
  status?: LocationStatusFilter
  sort: LocationSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<LocationSortKey, string> = {
  name: 'name',
  createdAt: 'created_at',
}

export default class LocationRepository {
  async paginate({ q, status, sort, direction, page, perPage }: PaginateLocationsData) {
    return Location.query()
      .withAggregate('inventoryLevels', (query) => query.sum('available').as('available_total'))
      .if(q, (query) => {
        query.where((group) => {
          group
            .whereILike('name', containsPattern(q))
            .orWhereILike('city', containsPattern(q))
            .orWhereILike('country', containsPattern(q))
        })
      })
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  async allActive(): Promise<Location[]> {
    return Location.query()
      .where('is_active', true)
      .orderBy('is_default', 'desc')
      .orderBy('name', 'asc')
  }

  async findOrFail(id: string): Promise<Location> {
    return Location.findOrFail(id)
  }

  async findDefault(): Promise<Location | null> {
    return Location.findBy('is_default', true)
  }

  async exportRows(
    { q, status, sort, direction }: Omit<PaginateLocationsData, 'page' | 'perPage'>,
    limit: number
  ): Promise<Location[]> {
    return Location.query()
      .select('id', 'name', 'address_line', 'city', 'country', 'is_active', 'created_at')
      .if(q, (query) => {
        query.where((group) => {
          group
            .whereILike('name', containsPattern(q))
            .orWhereILike('city', containsPattern(q))
            .orWhereILike('country', containsPattern(q))
        })
      })
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .limit(limit)
  }

  /** Names from `names` that are taken (ignoring case), lowercased. */
  async namesIn(names: string[]): Promise<string[]> {
    if (names.length === 0) return []
    const rows = await Location.query()
      .whereRaw(...lowerIn('name', names))
      .select('name')
    return rows.map(({ name }) => name.toLowerCase())
  }

  /** Imported locations are never the default location. */
  async createMany(rows: (LocationData & { isActive: boolean })[]): Promise<Location[]> {
    return db.transaction((trx) =>
      Location.createMany(
        rows.map((row) => ({ ...row, isDefault: false })),
        { client: trx }
      )
    )
  }

  async create(data: CreateLocationData): Promise<Location> {
    return Location.create({ isActive: true, isDefault: false, ...data })
  }

  async update(location: Location, data: LocationData): Promise<Location> {
    return location.merge(data).save()
  }

  async setActive(location: Location, isActive: boolean): Promise<Location> {
    return location.merge({ isActive }).save()
  }

  /**
   * Archives (`isActive = false`) or restores the locations in `ids`,
   * skipping ones already in that state. The default location and
   * locations still holding stock are never archived. Returns the changed
   * rows as they were.
   */
  async setActiveMany(ids: string[], isActive: boolean): Promise<Location[]> {
    return bulkUpdate(Location, ids, { isActive }, (query) =>
      query.where('is_active', !isActive).if(!isActive, (scoped) =>
        scoped.where('is_default', false).whereRaw(
          `(select coalesce(sum(il.available + il.committed + il.incoming), 0)
              from inventory_levels il
              where il.location_id = locations.id) <= 0`
        )
      )
    )
  }

  /**
   * Units of any state (available, committed, incoming) held at the location.
   */
  async totalUnits(location: Location): Promise<number> {
    const row = await db
      .from('inventory_levels')
      .where('location_id', location.id)
      .select(db.raw('coalesce(sum(available + committed + incoming), 0) as total'))
      .first()
    return Number(row?.total ?? 0)
  }
}
