import { inject } from '@adonisjs/core'
import SitemapRepository, { type SitemapEntry } from '#repositories/sitemap_repository'
import { absoluteUrl } from '#utils/app_url'

/** A sitemap file may list at most 50,000 URLs; the home page takes one. */
export const SITEMAP_LIMITS = { products: 40_000, collections: 5_000, pages: 4_999 }

/** Paths crawlers should skip: staff, signed-in and auth screens. */
export const ROBOTS_DISALLOW = [
  '/admin',
  '/account',
  '/checkout',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/places/',
]

/**
 * Crawlers that collect pages to train AI models. They are blocked from
 * the whole site. Search engines and AI search/answer bots (OAI-SearchBot,
 * ChatGPT-User, PerplexityBot) still follow the `*` rules, so the store
 * keeps showing up in search results and AI answers.
 */
export const AI_TRAINING_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'meta-externalagent',
  'cohere-ai',
  'cohere-training-data-crawler',
  'Diffbot',
  'Omgilibot',
  'Timpibot',
  'ImagesiftBot',
  'img2dataset',
]

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) => XML_ENTITIES[char])

function urlElement(loc: string, lastmod: string | null): string {
  const modified = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''
  return `<url><loc>${escapeXml(loc)}</loc>${modified}</url>`
}

@inject()
export default class SitemapService {
  constructor(protected sitemapRepository: SitemapRepository) {}

  async xml(): Promise<string> {
    const { products, collections, pages } = await this.sitemapRepository.entries(SITEMAP_LIMITS)
    const section = (prefix: string, entries: SitemapEntry[]) =>
      entries.map(({ slug, updatedAt }) =>
        urlElement(
          absoluteUrl(`${prefix}/${encodeURIComponent(slug)}`),
          updatedAt ? updatedAt.toISOString().slice(0, 10) : null
        )
      )

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      urlElement(absoluteUrl('/'), null),
      ...section('/collections', collections),
      ...section('/products', products),
      ...section('/pages', pages),
      '</urlset>',
      '',
    ].join('\n')
  }

  robots(): string {
    return [
      ...AI_TRAINING_CRAWLERS.map((agent) => `User-agent: ${agent}`),
      'Disallow: /',
      '',
      'User-agent: *',
      ...ROBOTS_DISALLOW.map((path) => `Disallow: ${path}`),
      '',
      `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
      '',
    ].join('\n')
  }
}
