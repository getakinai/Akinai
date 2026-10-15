import env from '#start/env'
import { publicDriveDisk } from '#utils/drive_disk'

const trimSlash = (value: string) => value.replace(/\/+$/, '')

/**
 * Public URL for a Drive key. Synchronous so transformers can call it.
 * `CDN_URL` (e.g. CloudFront) wins; otherwise the `fs` disk serves files at
 * `/uploads` and S3 uses the bucket URL.
 */
export function imageUrl(key: string): string {
  const cdnUrl = env.get('CDN_URL')
  if (cdnUrl) return `${trimSlash(cdnUrl)}/${key}`

  if (publicDriveDisk() === 's3') {
    const bucket = env.get('S3_BUCKET')
    const endpoint = env.get('S3_ENDPOINT')
    if (endpoint) return `${trimSlash(endpoint)}/${bucket}/${key}`
    return `https://${bucket}.s3.${env.get('AWS_REGION') ?? 'us-east-1'}.amazonaws.com/${key}`
  }

  return `/uploads/${key}`
}
