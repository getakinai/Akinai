import { test } from '@japa/runner'
import { isExcludedFromMaintenance } from '#middleware/maintenance_middleware'

test.group('isExcludedFromMaintenance', () => {
  test('excludes the back office', ({ assert }) => {
    assert.isTrue(isExcludedFromMaintenance('/admin'))
    assert.isTrue(isExcludedFromMaintenance('/admin/login'))
    assert.isTrue(isExcludedFromMaintenance('/admin/products/edit/1'))
  })

  test('excludes the crawler files', ({ assert }) => {
    assert.isTrue(isExcludedFromMaintenance('/robots.txt'))
    assert.isTrue(isExcludedFromMaintenance('/sitemap.xml'))
    assert.isFalse(isExcludedFromMaintenance('/robots.txt/extra'))
  })

  test('excludes the maintenance page newsletter signup only', ({ assert }) => {
    assert.isTrue(isExcludedFromMaintenance('/maintenance/newsletter'))
    assert.isFalse(isExcludedFromMaintenance('/newsletter'))
    assert.isFalse(isExcludedFromMaintenance('/maintenance'))
    assert.isFalse(isExcludedFromMaintenance('/maintenance/newsletter/extra'))
  })

  test('excludes the installed plugins list the maintenance page reads', ({ assert }) => {
    assert.isTrue(isExcludedFromMaintenance('/store/plugins'))
    assert.isFalse(isExcludedFromMaintenance('/store/plugins/extra'))
  })

  test('does not exclude storefront paths', ({ assert }) => {
    assert.isFalse(isExcludedFromMaintenance('/'))
    assert.isFalse(isExcludedFromMaintenance('/store/settings'))
    assert.isFalse(isExcludedFromMaintenance('/account'))
  })

  test('does not exclude paths that only start with the same letters', ({ assert }) => {
    assert.isFalse(isExcludedFromMaintenance('/administrator'))
    assert.isFalse(isExcludedFromMaintenance('/admins/login'))
  })
})
