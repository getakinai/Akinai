import { test } from '@japa/runner'
import {
  deviceTypeFor,
  isBotUserAgent,
  referrerHostOf,
  trafficSourceFor,
} from '#utils/analytics_traffic'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const ANDROID_PHONE =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'
const ANDROID_TABLET =
  'Mozilla/5.0 (Linux; Android 15; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

test.group('Analytics traffic: bots', () => {
  test('treats a missing or blank user agent as a bot', ({ assert }) => {
    assert.isTrue(isBotUserAgent(undefined))
    assert.isTrue(isBotUserAgent(''))
    assert.isTrue(isBotUserAgent('   '))
  })

  test('flags crawlers, link previews and scripts', ({ assert }) => {
    assert.isTrue(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)'))
    assert.isTrue(isBotUserAgent('facebookexternalhit/1.1'))
    assert.isTrue(isBotUserAgent('Mozilla/5.0 HeadlessChrome/130.0'))
    assert.isTrue(isBotUserAgent('curl/8.7.1'))
    assert.isTrue(isBotUserAgent('python-requests/2.32'))
  })

  test('lets real browsers through', ({ assert }) => {
    assert.isFalse(isBotUserAgent(IPHONE))
    assert.isFalse(isBotUserAgent(MAC))
  })
})

test.group('Analytics traffic: device type', () => {
  test('detects phones, tablets and desktops', ({ assert }) => {
    assert.equal(deviceTypeFor(IPHONE), 'mobile')
    assert.equal(deviceTypeFor(ANDROID_PHONE), 'mobile')
    assert.equal(deviceTypeFor(IPAD), 'tablet')
    assert.equal(deviceTypeFor(ANDROID_TABLET), 'tablet')
    assert.equal(deviceTypeFor(MAC), 'desktop')
  })

  test('falls back to desktop without a user agent', ({ assert }) => {
    assert.equal(deviceTypeFor(undefined), 'desktop')
  })
})

test.group('Analytics traffic: referrer host', () => {
  test('lowercases the host and drops www', ({ assert }) => {
    assert.equal(referrerHostOf('https://WWW.Google.com/search?q=mugs'), 'google.com')
    assert.equal(referrerHostOf('http://blog.example.org/post'), 'blog.example.org')
  })

  test('returns null for empty, invalid or non-http referrers', ({ assert }) => {
    assert.isNull(referrerHostOf(undefined))
    assert.isNull(referrerHostOf(''))
    assert.isNull(referrerHostOf('not a url'))
    assert.isNull(referrerHostOf('android-app://com.google.android.gm/'))
    assert.isNull(referrerHostOf('javascript:alert(1)'))
  })
})

test.group('Analytics traffic: source', () => {
  const storeHost = 'getakinai.com'

  test('no referrer is direct', ({ assert }) => {
    assert.equal(trafficSourceFor({ referrerHost: null, storeHost }), 'direct')
  })

  test('a referrer on the store itself is direct', ({ assert }) => {
    assert.equal(trafficSourceFor({ referrerHost: storeHost, storeHost }), 'direct')
  })

  test('a utm_source without a referrer is a referral', ({ assert }) => {
    assert.equal(
      trafficSourceFor({ referrerHost: null, storeHost, utmSource: 'partner-blog' }),
      'referral'
    )
  })

  test('paid mediums and ad click ids are paid', ({ assert }) => {
    assert.equal(
      trafficSourceFor({ referrerHost: 'google.com', storeHost, utmMedium: 'CPC' }),
      'paid'
    )
    assert.equal(
      trafficSourceFor({ referrerHost: 'google.com', storeHost, hasClickId: true }),
      'paid'
    )
  })

  test('email and social mediums win over the referrer', ({ assert }) => {
    assert.equal(
      trafficSourceFor({ referrerHost: 'google.com', storeHost, utmMedium: 'newsletter' }),
      'email'
    )
    assert.equal(trafficSourceFor({ referrerHost: null, storeHost, utmMedium: 'social' }), 'social')
  })

  test('classifies known search, social and webmail hosts', ({ assert }) => {
    assert.equal(trafficSourceFor({ referrerHost: 'google.com.au', storeHost }), 'search')
    assert.equal(trafficSourceFor({ referrerHost: 'duckduckgo.com', storeHost }), 'search')
    assert.equal(trafficSourceFor({ referrerHost: 'l.facebook.com', storeHost }), 'social')
    assert.equal(trafficSourceFor({ referrerHost: 't.co', storeHost }), 'social')
    assert.equal(trafficSourceFor({ referrerHost: 'mail.google.com', storeHost }), 'email')
  })

  test('does not match lookalike hosts', ({ assert }) => {
    assert.equal(trafficSourceFor({ referrerHost: 'notfacebook.com', storeHost }), 'referral')
    assert.equal(trafficSourceFor({ referrerHost: 'blog.example.org', storeHost }), 'referral')
  })
})
