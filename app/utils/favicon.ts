import sharp from 'sharp'
import {
  FAVICON_ICO_FILE,
  FAVICON_ICO_SIZE,
  FAVICON_MIN_SIZE,
  FAVICON_PNG_FILES,
} from '#constants/branding'

export type RenderedFavicon = { name: string; contentType: string; contents: Buffer }

/** The source image cannot be turned into favicons. */
export class FaviconSourceError extends Error {}

/**
 * Wraps one PNG in an ICO container. Every current browser reads
 * PNG-compressed ICO entries.
 */
export function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)

  const entry = Buffer.alloc(16)
  entry.writeUInt8(size >= 256 ? 0 : size, 0)
  entry.writeUInt8(size >= 256 ? 0 : size, 1)
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(header.length + entry.length, 12)

  return Buffer.concat([header, entry, png])
}

/**
 * Resizes a square source image into every favicon size plus `favicon.ico`.
 */
export async function renderFavicons(source: Buffer): Promise<RenderedFavicon[]> {
  let width: number | undefined
  let height: number | undefined
  try {
    ;({ width, height } = await sharp(source).metadata())
  } catch {
    throw new FaviconSourceError('This file is not an image we can read.')
  }

  if (!width || !height) throw new FaviconSourceError('This file is not an image we can read.')
  if (width !== height) throw new FaviconSourceError('Use a square image.')
  if (width < FAVICON_MIN_SIZE) {
    throw new FaviconSourceError(
      `Use an image at least ${FAVICON_MIN_SIZE} x ${FAVICON_MIN_SIZE} pixels.`
    )
  }

  const sizes = [...new Set([...FAVICON_PNG_FILES.map(({ size }) => size), FAVICON_ICO_SIZE])]
  const rendered = await Promise.all(
    sizes.map(async (size) => {
      const png = await sharp(source).rotate().resize(size, size, { fit: 'cover' }).png().toBuffer()
      return [size, png] as const
    })
  )
  const bySize = new Map(rendered)

  return [
    ...FAVICON_PNG_FILES.map(({ name, size }) => ({
      name,
      contentType: 'image/png',
      contents: bySize.get(size)!,
    })),
    {
      name: FAVICON_ICO_FILE,
      contentType: 'image/x-icon',
      contents: pngToIco(bySize.get(FAVICON_ICO_SIZE)!, FAVICON_ICO_SIZE),
    },
  ]
}
