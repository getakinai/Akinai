import { inject } from '@adonisjs/core'
import {
  SUPPORT_CHAT_PHRASES,
  SUPPORT_CHAT_STOPWORDS,
  type SupportChatPhraseKey,
} from '#constants/support_chat_phrases'
import HelpArticleRepository, {
  type HelpArticle,
  type HelpLibrary,
} from '#repositories/help_article_repository'

export const SUPPORT_CHAT_INTENTS = [
  'greeting',
  'thanks',
  'goodbye',
  'human',
  'order_status',
  'answer',
  'unsure',
  'no_match',
] as const

export type SupportChatIntent = (typeof SUPPORT_CHAT_INTENTS)[number]

export type SupportChatLink = {
  title: string
  description: string | null
  href: string
}

/** What the help chat says back: short bubbles, link cards and quick replies. */
export type SupportChatReply = {
  intent: SupportChatIntent
  messages: string[]
  links: SupportChatLink[]
  suggestions: string[]
  offerHandoff: boolean
}

type IndexedArticle = {
  article: HelpArticle
  title: Set<string>
  keywords: Set<string>
  keywordPhrases: string[]
  description: Set<string>
  body: Set<string>
}

/** Search index per loaded help library, rebuilt when the library reloads. */
const indexCache = new WeakMap<HelpLibrary, IndexedArticle[]>()

type Match = { entry: IndexedArticle; score: number; coverage: number }

const MAX_QUESTION_WORDS = 12
const MAX_EXCERPT_LENGTH = 280
const MIN_PARAGRAPH_LENGTH = 40
const MAX_SUGGESTIONS = 3
const MAX_GREETING_TOPICS = 3

const WEIGHTS = { title: 6, keywords: 5, description: 3, body: 1, phrase: 8 }

const GREETING =
  /^(hi+|hello|hey|hiya|yo|good (morning|afternoon|evening|day)|kumusta|kamusta|musta|kia ora|g ?day)\b/
const THANKS =
  /^(thanks?|thank you|thankyou|ty|tysm|salamat|cheers|great|awesome|perfect|nice|ok(ay)? thanks?|got it|that helped|that helps)\b/
const GOODBYE =
  /^(bye|goodbye|good bye|see (you|ya)|that s all|thats all|nothing else|no thanks?|i m done|im done)\b/
const HUMAN =
  /\b(human|real person|live (agent|person|chat)|agent|representative|customer service|support team|talk to (someone|a person|you|staff|the team)|speak (to|with) (someone|a person|you|staff)|contact (you|the team|support)|email (you|the team|support)|call (you|me))\b/
const ORDER_STATUS =
  /\b(where (is|s) my (order|parcel|package)|track(ing)? (my )?(order|parcel|package)|order status|status of my order|has my order (shipped|arrived)|when will my order)\b/

const ORDER_STATUS_ARTICLE = 'track-your-order'

/** Folds a word to a rough stem so "orders", "ordering" and "ordered" match "order". */
function stem(word: string): string {
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3)
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2)
  if (word.length > 4 && word.endsWith('es') && !word.endsWith('ses')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function words(value: string): string[] {
  return normalize(value)
    .split(' ')
    .filter((word) => word.length > 1 && !SUPPORT_CHAT_STOPWORDS.has(word))
    .map(stem)
}

function wordSet(value: string): Set<string> {
  return new Set(words(value))
}

/** Stable 32-bit FNV-1a hash, used to pick phrase versions. */
function hash(value: string): number {
  let result = 0x811c9dc5
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 0x01000193)
  }
  return result >>> 0
}

function articleHref(article: HelpArticle) {
  return `/help/${article.categorySlug}/${article.slug}`
}

function articleLink(article: HelpArticle): SupportChatLink {
  return { title: article.title, description: article.description, href: articleHref(article) }
}

/**
 * The storefront help chat. It is not a live agent: every answer is quoted
 * from the active help center articles in the database (the ones staff edit
 * in the back office), phrased as short chat messages. Questions the docs
 * don't cover are handed to the support inbox.
 */
@inject()
export default class SupportChatService {
  constructor(protected helpArticleRepository: HelpArticleRepository) {}

  async answer(question: string): Promise<SupportChatReply> {
    const library = await this.helpArticleRepository.library()
    const normalized = normalize(question)
    const seed = hash(normalized)
    const say = (key: SupportChatPhraseKey, offset = 0) => this.pick(key, seed + offset)
    const onlySmallTalk = (pattern: RegExp) =>
      pattern.test(normalized) && words(normalized.replace(pattern, '')).length <= 1
    const tokens = [...new Set(words(normalized.replace(GREETING, '')))].slice(
      0,
      MAX_QUESTION_WORDS
    )

    if (HUMAN.test(normalized)) {
      return this.reply('human', [say('human'), say('humanDetails', 1)], { offerHandoff: true })
    }

    if (GREETING.test(normalized) && tokens.length === 0) {
      const popular = library.articles.filter((article) => article.popular)
      return this.reply('greeting', [say('greeting'), say('greetingTopics', 1)], {
        suggestions: popular.slice(0, MAX_GREETING_TOPICS).map((article) => article.title),
      })
    }

    if (onlySmallTalk(THANKS)) return this.reply('thanks', [say('thanks')])
    if (onlySmallTalk(GOODBYE)) return this.reply('goodbye', [say('goodbye')])

    const index = this.index(library)

    if (ORDER_STATUS.test(normalized)) {
      const tracking = index.find((entry) => entry.article.slug === ORDER_STATUS_ARTICLE)
      if (tracking) {
        return this.reply(
          'order_status',
          [
            say('orderStatus'),
            this.excerpt(tracking.article, wordSet('track order status')),
            say('orderStatusAccount', 1),
          ],
          {
            links: [
              articleLink(tracking.article),
              {
                title: 'My orders',
                description: 'Sign in to see every order',
                href: '/account/orders',
              },
            ],
            suggestions: this.relatedTitles(tracking.article, library),
          }
        )
      }
    }

    const matches = this.rank(index, tokens, normalized)
    const [best] = matches
    if (!best || tokens.length === 0) {
      return this.reply('no_match', [say('noMatch'), say('handoffOffer', 1)], {
        offerHandoff: true,
      })
    }

    const confident = best.coverage >= 0.6 && best.score >= 10
    const plausible = best.coverage >= 0.34 && best.score >= 5
    if (!confident && !plausible) {
      return this.reply('no_match', [say('noMatch'), say('handoffOffer', 1)], {
        offerHandoff: true,
        suggestions: matches.slice(0, MAX_SUGGESTIONS).map(({ entry }) => entry.article.title),
      })
    }

    const article = best.entry.article
    const excerpt = this.excerpt(article, new Set(tokens))
    const readMore = say('readMore', 2).replace('{title}', `“${article.title}”`)

    if (confident) {
      return this.reply('answer', [say('confidentOpener'), excerpt, readMore], {
        links: [articleLink(article)],
        suggestions: this.relatedTitles(article, library),
      })
    }

    const alternatives = matches
      .slice(1, 1 + MAX_SUGGESTIONS)
      .map(({ entry }) => entry.article.title)
    return this.reply(
      'unsure',
      [say('unsureOpener'), excerpt, ...(alternatives.length > 0 ? [say('didYouMean', 3)] : [])],
      {
        links: [articleLink(article)],
        suggestions: alternatives.length > 0 ? alternatives : this.relatedTitles(article, library),
      }
    )
  }

  protected reply(
    intent: SupportChatIntent,
    messages: string[],
    extra: Partial<Omit<SupportChatReply, 'intent' | 'messages'>> = {}
  ): SupportChatReply {
    return {
      intent,
      messages,
      links: extra.links ?? [],
      suggestions: extra.suggestions ?? [],
      offerHandoff: extra.offerHandoff ?? false,
    }
  }

  protected pick(key: SupportChatPhraseKey, seed: number): string {
    const options = SUPPORT_CHAT_PHRASES[key]
    return options[seed % options.length]
  }

  protected relatedTitles(article: HelpArticle, library: HelpLibrary): string[] {
    const bySlug = new Map(library.articles.map((item) => [item.slug, item]))
    return article.related
      .flatMap((slug) => bySlug.get(slug) ?? [])
      .slice(0, MAX_SUGGESTIONS)
      .map((item) => item.title)
  }

  /**
   * Scores every article. Unlike the help search, not every word has to
   * match: chat questions are full sentences, so the share of matched words
   * (`coverage`) decides how sure the bot is.
   */
  protected rank(index: IndexedArticle[], tokens: string[], normalized: string): Match[] {
    if (tokens.length === 0) return []
    const matches: Match[] = []

    for (const entry of index) {
      let score = 0
      let matched = 0
      for (const token of tokens) {
        let tokenScore = 0
        if (entry.title.has(token)) tokenScore += WEIGHTS.title
        if (entry.keywords.has(token)) tokenScore += WEIGHTS.keywords
        if (entry.description.has(token)) tokenScore += WEIGHTS.description
        if (entry.body.has(token)) tokenScore += WEIGHTS.body
        if (tokenScore > 0) matched += 1
        score += tokenScore
      }
      for (const phrase of entry.keywordPhrases) {
        if (phrase.includes(' ') && normalized.includes(phrase)) score += WEIGHTS.phrase
      }
      if (score > 0) matches.push({ entry, score, coverage: matched / tokens.length })
    }

    return matches.sort(
      (a, b) =>
        b.coverage - a.coverage ||
        b.score - a.score ||
        a.entry.article.title.localeCompare(b.entry.article.title)
    )
  }

  /**
   * The sentences of the article that best answer the question, up to
   * about 280 characters, ending on a full sentence where possible.
   */
  protected excerpt(article: HelpArticle, tokens: Set<string>): string {
    const paragraphs = article.paragraphs.filter((block) => block.length >= MIN_PARAGRAPH_LENGTH)
    if (paragraphs.length === 0) return article.description

    const overlap = (value: string) => words(value).filter((word) => tokens.has(word)).length
    let bestParagraph = paragraphs[0]
    let bestScore = overlap(bestParagraph)
    for (const paragraph of paragraphs.slice(1)) {
      const score = overlap(paragraph)
      if (score > bestScore) {
        bestParagraph = paragraph
        bestScore = score
      }
    }

    if (bestParagraph.length <= MAX_EXCERPT_LENGTH) return bestParagraph

    const sentences = bestParagraph.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [bestParagraph]
    let start = 0
    let startScore = -1
    sentences.forEach((sentence, position) => {
      const score = overlap(sentence)
      if (score > startScore) {
        start = position
        startScore = score
      }
    })

    let result = ''
    for (const sentence of sentences.slice(start)) {
      const next = `${result}${sentence}`.trim()
      if (next.length > MAX_EXCERPT_LENGTH) break
      result = `${next} `
    }
    result = result.trim()
    if (result.length > 0) return result

    const cut = sentences[start].slice(0, MAX_EXCERPT_LENGTH)
    return `${cut.slice(0, cut.lastIndexOf(' ')).trim()}…`
  }

  protected index(library: HelpLibrary): IndexedArticle[] {
    const cached = indexCache.get(library)
    if (cached) return cached

    const entries = library.articles.map((article) => ({
      article,
      title: wordSet(article.title),
      keywords: wordSet(article.keywords.join(' ')),
      keywordPhrases: article.keywords.map(normalize),
      description: wordSet(article.description),
      body: wordSet(article.text),
    }))
    indexCache.set(library, entries)
    return entries
  }
}
