import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import { compareChange, padMonths, sharePercent } from '#services/dashboard_service'

test.group('DashboardService helpers', () => {
  test('compareChange reads 0 to 0 as flat', ({ assert }) => {
    assert.deepEqual(compareChange(0, 0), { percent: 0, trend: 'flat' })
  })

  test('compareChange marks growth from 0 as new', ({ assert }) => {
    assert.deepEqual(compareChange(120, 0), { percent: null, trend: 'up' })
  })

  test('compareChange rounds the percent and sets the trend', ({ assert }) => {
    assert.deepEqual(compareChange(110, 100), { percent: 10, trend: 'up' })
    assert.deepEqual(compareChange(93, 100), { percent: -7, trend: 'down' })
    assert.deepEqual(compareChange(0, 50), { percent: -100, trend: 'down' })
  })

  test('compareChange treats changes under 1% as flat', ({ assert }) => {
    assert.deepEqual(compareChange(1004, 1000), { percent: 0, trend: 'flat' })
  })

  test('sharePercent returns 0 for an empty whole and clamps to 0–100', ({ assert }) => {
    assert.equal(sharePercent(5, 0), 0)
    assert.equal(sharePercent(1, 3), 33)
    assert.equal(sharePercent(2, 3), 67)
    assert.equal(sharePercent(5, 4), 100)
  })

  test('padMonths fills every month with zeros where there were no orders', ({ assert }) => {
    const start = DateTime.fromISO('2026-05-01', { zone: 'Pacific/Auckland' }).setLocale('en')

    const months = padMonths(start, 6, [
      { month: '2026-07', revenue: 250, orders: 2, discounts: 10 },
      { month: '2026-10', revenue: 90, orders: 1, discounts: 0 },
    ])

    assert.deepEqual(
      months.map(({ month, label, revenue }) => ({ month, label, revenue })),
      [
        { month: '2026-05', label: 'May', revenue: 0 },
        { month: '2026-06', label: 'Jun', revenue: 0 },
        { month: '2026-07', label: 'Jul', revenue: 250 },
        { month: '2026-08', label: 'Aug', revenue: 0 },
        { month: '2026-09', label: 'Sep', revenue: 0 },
        { month: '2026-10', label: 'Oct', revenue: 90 },
      ]
    )
    assert.equal(months[2].orders, 2)
    assert.equal(months[5].longLabel, 'October 2026')
  })

  test('padMonths crosses the year boundary', ({ assert }) => {
    const start = DateTime.fromISO('2026-11-01', { zone: 'UTC' }).setLocale('en')

    const months = padMonths(start, 3, [])

    assert.deepEqual(
      months.map(({ month }) => month),
      ['2026-11', '2026-12', '2027-01']
    )
  })
})
