import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'
import { publicDriveDisk } from '#utils/drive_disk'

const s3Credentials = {
  accessKeyId: env.get('AWS_ACCESS_KEY_ID') ?? '',
  secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY')?.release() ?? '',
}

const driveConfig = defineConfig({
  default: publicDriveDisk(),

  /**
   * `fs` stores uploads under `storage/` and serves them at `/uploads`
   * (local and test). Production always uses `s3`.
   *
   * `fsPrivate` / `s3Private` hold files that must never be public
   * (payment proofs). They are only read through authenticated routes, so
   * `fsPrivate` lives outside `storage/` and doesn't serve files.
   */
  services: {
    fs: services.fs({
      location: app.makePath('storage'),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'public',
    }),
    s3: services.s3({
      credentials: s3Credentials,
      region: env.get('AWS_REGION') ?? 'us-east-1',
      bucket: env.get('S3_BUCKET') ?? '',
      endpoint: env.get('S3_ENDPOINT'),
      visibility: 'public',
      supportsACL: false,
    }),
    fsPrivate: services.fs({
      location: app.makePath('private_storage'),
      serveFiles: false,
      visibility: 'private',
    }),
    s3Private: services.s3({
      credentials: s3Credentials,
      region: env.get('AWS_REGION') ?? 'us-east-1',
      // Falls back to the public bucket; private keys then live under `private/`.
      bucket: env.get('S3_PRIVATE_BUCKET') || env.get('S3_BUCKET') || '',
      endpoint: env.get('S3_ENDPOINT'),
      visibility: 'private',
      supportsACL: false,
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
