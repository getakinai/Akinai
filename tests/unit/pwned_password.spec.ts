import { test } from '@japa/runner'
import { createHash } from 'node:crypto'
import { isValid } from 'mailchecker'
import { isPwnedCheckEnabled, pwnedPasswordCount } from '#utils/pwned_password'

function sha1(value: string) {
  return createHash('sha1').update(value).digest('hex').toUpperCase()
}

function fakeFetch(body: string, status = 200) {
  const calls: { url: string; headers: Record<string, string> }[] = []
  const fetcher = (async (url: string, init?: RequestInit) => {
    calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> })
    return new Response(body, { status })
  }) as unknown as typeof fetch
  return { fetcher, calls }
}

test.group('pwnedPasswordCount', () => {
  test('sends only the 5-character hash prefix, with padding', async ({ assert }) => {
    const digest = sha1('password123')
    const { fetcher, calls } = fakeFetch('')

    await pwnedPasswordCount('password123', fetcher)

    assert.lengthOf(calls, 1)
    assert.equal(calls[0].url, `https://api.pwnedpasswords.com/range/${digest.slice(0, 5)}`)
    assert.notInclude(calls[0].url, digest.slice(5))
    assert.equal(calls[0].headers['Add-Padding'], 'true')
  })

  test('returns the breach count when the suffix is listed', async ({ assert }) => {
    const suffix = sha1('password123').slice(5)
    const { fetcher } = fakeFetch(`0000000000000000000000000000000000A:0\r\n${suffix}:2254650\r\n`)

    assert.equal(await pwnedPasswordCount('password123', fetcher), 2254650)
  })

  test('returns 0 when the suffix is not listed (or only as padding)', async ({ assert }) => {
    const suffix = sha1('a unique passphrase nobody uses').slice(5)
    const { fetcher } = fakeFetch(`${'F'.repeat(35)}:12\r\n${suffix}:0\r\n`)

    assert.equal(await pwnedPasswordCount('a unique passphrase nobody uses', fetcher), 0)
  })

  test('fails open when the service errors or is unreachable', async ({ assert }) => {
    const { fetcher } = fakeFetch('oops', 503)
    assert.equal(await pwnedPasswordCount('password123', fetcher), 0)

    const throwing = (async () => {
      throw new Error('network down')
    }) as unknown as typeof fetch
    assert.equal(await pwnedPasswordCount('password123', throwing), 0)
  })

  test('is disabled in tests', ({ assert }) => {
    assert.isFalse(isPwnedCheckEnabled())
  })
})

test.group('mailchecker', () => {
  test('flags throwaway domains and allows normal ones', ({ assert }) => {
    assert.isFalse(isValid('someone@mailinator.com'))
    assert.isFalse(isValid('someone@yopmail.com'))
    assert.isTrue(isValid('someone@gmail.com'))
    assert.isTrue(isValid('someone@example.co.nz'))
  })
})
