import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import {
  bucketKey,
  bucketLabel,
  bucketStarts,
  grainFor,
  resolveAnalyticsRange,
} from '#utils/analytics_range'

const ZONE = 'Australia/Sydney'
const NOW = DateTime.fromISO('2026-10-11T15:30:00', { zone: ZONE })

const iso = (value: DateTime | null) => value?.toISODate() ?? null

test.group('Analytics range: resolve', () => {
  test('defaults to the last 30 days against the previous 30', ({ assert }) => {
    const range = resolveAnalyticsRange({}, ZONE, NOW)

    assert.equal(iso(range.from), '2026-09-12')
    assert.equal(iso(range.end), '2026-10-12')
    assert.equal(range.days, 30)
    assert.equal(range.compare, 'previous_period')
    assert.equal(range.grain, 'day')
    assert.equal(iso(range.previousFrom), '2026-08-13')
    assert.equal(iso(range.previousEnd), '2026-09-12')
  })

  test('starts days at midnight in the store timezone', ({ assert }) => {
    const utcEvening = DateTime.fromISO('2026-10-11T20:00:00Z')

    const range = resolveAnalyticsRange({}, ZONE, utcEvening)

    assert.equal(range.from.zoneName, ZONE)
    assert.equal(iso(range.end), '2026-10-13')
    assert.equal(range.from.hour, 0)
  })

  test('uses an explicit range, inclusive of the last day', ({ assert }) => {
    const range = resolveAnalyticsRange({ from: '2026-10-01', to: '2026-10-07' }, ZONE, NOW)

    assert.equal(iso(range.from), '2026-10-01')
    assert.equal(iso(range.end), '2026-10-08')
    assert.equal(range.days, 7)
    assert.equal(iso(range.previousFrom), '2026-09-24')
    assert.equal(iso(range.previousEnd), '2026-10-01')
  })

  test('swaps a reversed range', ({ assert }) => {
    const range = resolveAnalyticsRange({ from: '2026-10-07', to: '2026-10-01' }, ZONE, NOW)

    assert.equal(iso(range.from), '2026-10-01')
    assert.equal(range.days, 7)
  })

  test('caps the range at two years', ({ assert }) => {
    const range = resolveAnalyticsRange({ from: '2020-01-01', to: '2026-10-11' }, ZONE, NOW)

    assert.equal(range.days, 731)
    assert.equal(iso(range.end), '2026-10-12')
    assert.equal(range.grain, 'month')
  })

  test('compares with the same days a year earlier', ({ assert }) => {
    const range = resolveAnalyticsRange(
      { from: '2026-10-01', to: '2026-10-07', compare: 'previous_year' },
      ZONE,
      NOW
    )

    assert.equal(iso(range.previousFrom), '2025-10-01')
    assert.equal(iso(range.previousEnd), '2025-10-08')
  })

  test('has no comparison when compare is none', ({ assert }) => {
    const range = resolveAnalyticsRange({ compare: 'none' }, ZONE, NOW)

    assert.isNull(range.previousFrom)
    assert.isNull(range.previousEnd)
  })

  test('a single day uses hourly buckets', ({ assert }) => {
    const range = resolveAnalyticsRange({ from: '2026-10-11', to: '2026-10-11' }, ZONE, NOW)

    assert.equal(range.days, 1)
    assert.equal(range.grain, 'hour')
  })
})

test.group('Analytics range: buckets', () => {
  test('grainFor picks hour, day, week or month by length', ({ assert }) => {
    assert.equal(grainFor(1), 'hour')
    assert.equal(grainFor(2), 'hour')
    assert.equal(grainFor(3), 'day')
    assert.equal(grainFor(90), 'day')
    assert.equal(grainFor(91), 'week')
    assert.equal(grainFor(366), 'week')
    assert.equal(grainFor(367), 'month')
  })

  test('bucketStarts covers every hour of a day', ({ assert }) => {
    const from = DateTime.fromISO('2026-10-11', { zone: 'UTC' })

    const starts = bucketStarts(from, from.plus({ days: 1 }), 'hour')

    assert.lengthOf(starts, 24)
    assert.equal(bucketKey(starts[0]), '2026-10-11T00:00')
    assert.equal(bucketKey(starts[23]), '2026-10-11T23:00')
  })

  test('bucketStarts covers every day of the range', ({ assert }) => {
    const from = DateTime.fromISO('2026-09-28', { zone: 'UTC' })

    const starts = bucketStarts(from, from.plus({ days: 7 }), 'day')

    assert.deepEqual(starts.map(bucketKey), [
      '2026-09-28T00:00',
      '2026-09-29T00:00',
      '2026-09-30T00:00',
      '2026-10-01T00:00',
      '2026-10-02T00:00',
      '2026-10-03T00:00',
      '2026-10-04T00:00',
    ])
  })

  test('bucketStarts aligns months to the first of the month', ({ assert }) => {
    const from = DateTime.fromISO('2026-01-15', { zone: 'UTC' })

    const starts = bucketStarts(from, DateTime.fromISO('2026-04-02', { zone: 'UTC' }), 'month')

    assert.deepEqual(starts.map(bucketKey), [
      '2026-01-01T00:00',
      '2026-02-01T00:00',
      '2026-03-01T00:00',
      '2026-04-01T00:00',
    ])
  })

  test('bucketLabel formats by grain', ({ assert }) => {
    const start = DateTime.fromISO('2026-10-11T09:00', { zone: 'UTC' }).setLocale('en')

    assert.equal(bucketLabel(start, 'hour', 1), '09:00')
    assert.equal(bucketLabel(start, 'hour', 2), 'Sun 09:00')
    assert.equal(bucketLabel(start, 'day', 30), '11 Oct')
    assert.equal(bucketLabel(start, 'month', 400), 'Oct 2026')
  })
})
