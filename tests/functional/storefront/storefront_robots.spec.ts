import { test } from '@japa/runner'
import { AI_TRAINING_CRAWLERS, ROBOTS_DISALLOW } from '#services/sitemap_service'

test.group('Storefront robots.txt', () => {
  test('is served as plain text', async ({ client, assert }) => {
    const response = await client.get('/robots.txt')

    response.assertStatus(200)
    assert.include(String(response.header('content-type')), 'text/plain')
  })

  test('blocks AI training crawlers from the whole site', async ({ client, assert }) => {
    const response = await client.get('/robots.txt')
    const [aiBlock] = response.text().split('\n\n')

    for (const agent of AI_TRAINING_CRAWLERS) {
      assert.include(aiBlock, `User-agent: ${agent}\n`)
    }
    assert.include(aiBlock, 'Disallow: /')
  })

  test('lets other crawlers in, except private areas', async ({ client, assert }) => {
    const response = await client.get('/robots.txt')
    const text = response.text()

    assert.include(text, 'User-agent: *')
    for (const path of ROBOTS_DISALLOW) {
      assert.include(text, `Disallow: ${path}\n`)
    }
    assert.notInclude(text, 'Disallow: /store/')
    assert.match(text, /Sitemap: https?:\/\/\S+\/sitemap\.xml/)
  })

  test('does not block AI search bots by name', async ({ client, assert }) => {
    const response = await client.get('/robots.txt')

    for (const agent of ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Googlebot']) {
      assert.notInclude(response.text(), `User-agent: ${agent}`)
    }
  })
})
