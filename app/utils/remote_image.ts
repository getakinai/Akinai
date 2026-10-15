import { lookup as dnsLookup, type LookupAddress } from 'node:dns'
import https from 'node:https'
import { BlockList, isIP, type LookupFunction } from 'node:net'
import { MAX_IMAGE_UPLOAD_SIZE_BYTES, MAX_IMAGE_UPLOAD_SIZE_MB } from '#constants/upload_limits'

const MAX_REDIRECTS = 3
const TIMEOUT_MS = 15_000
export const MAX_REMOTE_IMAGE_URL_LENGTH = 2048

/** A download that failed for a reason staff can act on. */
export class RemoteImageError extends Error {}

/**
 * Addresses a download must never reach: loopback, private networks,
 * link-local (cloud metadata), carrier-grade NAT, multicast and other
 * reserved ranges, plus NAT64 IPv6. `BlockList` applies the IPv4 rules to
 * IPv4-mapped IPv6 addresses (`::ffff:10.0.0.1`) too, and would apply a
 * `::ffff:0:0/96` rule to every IPv4 address, so there is no such rule.
 */
const blocked = new BlockList()
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blocked.addSubnet(network, prefix, 'ipv4')
}
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blocked.addSubnet(network, prefix, 'ipv6')
}

export function isBlockedAddress(address: string): boolean {
  const family = isIP(address)
  if (family === 0) return true
  return blocked.check(address, family === 4 ? 'ipv4' : 'ipv6')
}

/**
 * DNS lookup that refuses hostnames resolving to a blocked address. Runs
 * for the address actually connected to, so a rebinding DNS answer can't
 * slip past an earlier check.
 */
const safeLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses: LookupAddress[]) => {
    if (error) return callback(error, '', 4)
    if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
      return callback(new RemoteImageError('The image URL points to a private address.'), '', 4)
    }
    if (options.all) return callback(null, addresses as unknown as string)
    return callback(null, addresses[0].address, addresses[0].family)
  })
}

/** The URL if it's an absolute https URL on the default port, else an error. */
export function parseRemoteImageUrl(raw: string): URL {
  if (raw.length > MAX_REMOTE_IMAGE_URL_LENGTH) {
    throw new RemoteImageError('The image URL is too long.')
  }
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new RemoteImageError(`"${raw}" is not a valid URL.`)
  }
  if (url.protocol !== 'https:') throw new RemoteImageError('Image URLs must start with https://.')
  if (url.username || url.password) {
    throw new RemoteImageError('Image URLs cannot contain a username or password.')
  }
  if (url.port !== '') throw new RemoteImageError('Image URLs cannot use a custom port.')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (isIP(host) !== 0 && isBlockedAddress(host)) {
    throw new RemoteImageError('The image URL points to a private address.')
  }
  return url
}

function get(url: URL, redirectsLeft: number, signal: AbortSignal): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        lookup: safeLookup,
        signal,
        headers: { 'accept': 'image/*', 'user-agent': 'Akinai-ProductImport/1.0' },
      },
      (response) => {
        const status = response.statusCode ?? 0
        const location = response.headers.location

        if (status >= 300 && status < 400 && location) {
          response.resume()
          if (redirectsLeft === 0) {
            return reject(new RemoteImageError('The image URL redirects too many times.'))
          }
          try {
            const next = parseRemoteImageUrl(new URL(location, url).toString())
            return resolve(get(next, redirectsLeft - 1, signal))
          } catch (error) {
            return reject(error)
          }
        }
        if (status !== 200) {
          response.resume()
          return reject(new RemoteImageError(`The image URL returned HTTP ${status}.`))
        }

        const tooLarge = new RemoteImageError(
          `The image must be ${MAX_IMAGE_UPLOAD_SIZE_MB} MB or smaller.`
        )
        if (Number(response.headers['content-length'] ?? 0) > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
          response.destroy()
          return reject(tooLarge)
        }

        const chunks: Buffer[] = []
        let size = 0
        response.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
            response.destroy()
            reject(tooLarge)
            return
          }
          chunks.push(chunk)
        })
        response.on('end', () => resolve(Buffer.concat(chunks)))
        response.on('error', reject)
      }
    )
    request.on('error', (error) => {
      if (error instanceof RemoteImageError) return reject(error)
      if (signal.aborted) {
        return reject(new RemoteImageError('The image URL took too long to respond.'))
      }
      reject(new RemoteImageError('The image could not be downloaded.'))
    })
  })
}

/**
 * Downloads an image from a public https URL for re-upload. Only reaches
 * public addresses (checked at every redirect and connection), follows at
 * most 3 redirects, and stops at the upload size limit or after 15 seconds.
 * Throws `RemoteImageError` with a message staff can act on.
 */
export async function fetchRemoteImage(raw: string): Promise<Buffer> {
  return get(parseRemoteImageUrl(raw), MAX_REDIRECTS, AbortSignal.timeout(TIMEOUT_MS))
}
