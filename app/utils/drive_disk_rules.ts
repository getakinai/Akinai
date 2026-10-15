export type PublicDriveDisk = 'fs' | 's3'
export type PrivateDriveDisk = 'fsPrivate' | 's3Private'

type DriveDiskSettings = {
  nodeEnv: string
  driveDisk?: PublicDriveDisk
  drivePrivateDisk?: PrivateDriveDisk
}

/**
 * Production always stores uploads on S3: app containers are replaced on
 * every deploy and blue/green slots don't share a filesystem, so local
 * files would be lost or missing. Elsewhere `DRIVE_DISK` picks the disk
 * (default `fs`), and the private disk follows it unless set.
 */
export function resolveDriveDisks({ nodeEnv, driveDisk, drivePrivateDisk }: DriveDiskSettings): {
  public: PublicDriveDisk
  private: PrivateDriveDisk
} {
  if (nodeEnv === 'production') {
    return { public: 's3', private: 's3Private' }
  }
  const publicDisk = driveDisk ?? 'fs'
  return {
    public: publicDisk,
    private: drivePrivateDisk ?? (publicDisk === 's3' ? 's3Private' : 'fsPrivate'),
  }
}

/**
 * `S3_PRIVATE_BUCKET` is optional: without it, private uploads share
 * `S3_BUCKET` under the `private/` prefix.
 */
export const REQUIRED_S3_SETTINGS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'S3_BUCKET',
] as const

/**
 * The S3 settings production can't run without, by env variable name.
 */
export function missingS3Settings(
  values: Record<(typeof REQUIRED_S3_SETTINGS)[number], string | undefined>
) {
  return REQUIRED_S3_SETTINGS.filter((name) => !values[name]?.trim())
}
