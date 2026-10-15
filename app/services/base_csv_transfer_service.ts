import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import type { LucidModel } from '@adonisjs/lucid/types/model'
import { MAX_EXPORT_ROWS, MAX_IMPORT_ERRORS } from '#constants/csv_transfer'
import BusinessRuleException from '#exceptions/business_rule_exception'
import type { AuditValue, SecurityAction } from '#models/audit_log'
import type BaseAppModel from '#models/base/base_app_model'
import type AuditLogService from '#services/audit_log_service'
import type { SecuritySubject } from '#services/audit_log_service'
import {
  csvFileError,
  csvRowErrors,
  parseCsvImport,
  presentCells,
  toCsv,
  type CsvImportError,
} from '#utils/csv'

export type CsvImportResult = {
  created: number
  /** Existing records changed by the file (imports that upsert). */
  updated: number
  skipped: number
  errors: CsvImportError[]
  /** All errors found, including ones beyond the returned list. */
  errorCount: number
}

export type CsvExportActor = {
  user: SecuritySubject
  ipAddress: string | null
}

/** Records a problem with the row being built. */
export type CsvRowReporter = (field: string | null, message: string) => void

type CsvFilters = Record<string, string | undefined>

const lower = (value: string) => value.trim().toLowerCase()

/**
 * CSV import and export for a resource with one row per record. Imports
 * only create: a row whose key (name, handle) already exists or repeats in
 * the file is skipped and reported. Every cell is validated; the valid
 * rows are created together and the rest are reported by line.
 */
export default abstract class BaseCsvTransferService<
  Column extends string,
  Row,
  CreateData,
  Entity,
  Filters extends CsvFilters,
> {
  /** Header row, in order. */
  protected abstract readonly columns: readonly Column[]
  /** One record, then many: `['vendor', 'vendors']`. */
  protected abstract readonly noun: readonly [string, string]
  /** Column holding the record's unique key. */
  protected abstract readonly keyColumn: Column
  /** Model the created rows are audited as. */
  protected abstract readonly Model: LucidModel & { auditable?: boolean }
  protected abstract readonly exportEvent: SecurityAction
  protected readonly lowercaseColumns: readonly Column[] = []

  constructor(protected auditLogService: AuditLogService) {}

  /** Example rows; `suffix` keeps keys unique to one download. */
  protected abstract sampleRows(suffix: string): Promise<Record<Column, string>[]>
  /** Validates the non-empty cells of a row (throws Vine's validation error). */
  protected abstract validateRow(cells: Record<string, string>): Promise<Row>
  protected abstract keyOf(row: Row): string
  /** Keys from `keys` (lowercased) that already exist. */
  protected abstract existingKeys(keys: string[]): Promise<string[]>
  protected abstract fetchForExport(filters: Filters, limit: number): Promise<Entity[]>
  protected abstract toCsvRow(entity: Entity): Record<Column, string>
  /** The record to create. Rows with anything reported are skipped. */
  protected abstract build(row: Row, report: CsvRowReporter): CreateData | null
  /** Creates all records in one transaction. */
  protected abstract createMany(data: CreateData[]): Promise<BaseAppModel[]>

  get sampleFilename() {
    return `${this.noun[1].replaceAll(' ', '-')}-sample.csv`
  }

  async sampleCsv(): Promise<string> {
    const suffix = randomBytes(2).toString('hex')
    return toCsv(this.columns, await this.sampleRows(suffix))
  }

  /**
   * The records matching the list filters, in the import format. Logged as
   * a security event since it copies store data out.
   */
  async exportCsv(filters: Filters, actor: CsvExportActor) {
    const records = await this.fetchForExport(filters, MAX_EXPORT_ROWS + 1)
    if (records.length > MAX_EXPORT_ROWS) {
      throw new BusinessRuleException(
        `Too many ${this.noun[1]} to export. Narrow the search or filter.`
      )
    }

    const details: Record<string, AuditValue> = { count: records.length }
    for (const [key, value] of Object.entries(filters)) details[key] = value ?? null
    await this.auditLogService.recordSecurityEvent(this.exportEvent, actor.user, {
      ipAddress: actor.ipAddress,
      details,
    })

    return {
      filename: `${this.noun[1].replaceAll(' ', '-')}-${DateTime.now().toISODate()}.csv`,
      csv: toCsv(
        this.columns,
        records.map((record) => this.toCsvRow(record))
      ),
    }
  }

  async import(file: MultipartFile): Promise<CsvImportResult> {
    const records = parseCsvImport(await this.read(file), this.columns, this.noun[0])
    const errors: CsvImportError[] = []

    const valid: { line: number; row: Row; key: string }[] = []
    for (const { line, cells } of records) {
      try {
        const row = await this.validateRow(presentCells(cells, this.lowercaseColumns))
        valid.push({ line, row, key: lower(this.keyOf(row)) })
      } catch (error) {
        errors.push(...csvRowErrors(line, error))
      }
    }

    const counts = new Map<string, number>()
    for (const { key } of valid) counts.set(key, (counts.get(key) ?? 0) + 1)
    const existingKeys = await this.existingKeys([...counts.keys()])
    const existing = new Set(existingKeys.map(lower))

    const ready: CreateData[] = []
    for (const { line, row, key } of valid) {
      const found = errors.length
      const report: CsvRowReporter = (field, message) => errors.push({ row: line, field, message })
      const label = this.keyOf(row)

      if (existing.has(key)) {
        report(this.keyColumn, `A ${this.noun[0]} "${label}" already exists.`)
      } else if ((counts.get(key) ?? 0) > 1) {
        report(this.keyColumn, `"${label}" appears more than once in the file.`)
      }
      const data = this.build(row, report)
      if (data && errors.length === found) ready.push(data)
    }

    const created = await this.create(ready)
    await this.auditLogService.recordBulkCreate(this.Model, created, { source: 'csv_import' })

    return {
      created: created.length,
      updated: 0,
      skipped: records.length - created.length,
      errors: errors.slice(0, MAX_IMPORT_ERRORS),
      errorCount: errors.length,
    }
  }

  protected async read(file: MultipartFile): Promise<Buffer> {
    if (!file.tmpPath) csvFileError('Upload the file again.')
    return readFile(file.tmpPath)
  }

  /**
   * A key taken by another request between the checks and the insert trips
   * a unique constraint; nothing from the file is saved then.
   */
  protected async create(data: CreateData[]): Promise<BaseAppModel[]> {
    if (data.length === 0) return []
    try {
      return await this.createMany(data)
    } catch (error) {
      if ((error as { code?: string }).code !== '23505') throw error
      throw new BusinessRuleException(
        `A ${this.keyColumn.replaceAll('_', ' ')} in the file was taken while importing. Nothing was imported; try again.`
      )
    }
  }
}
