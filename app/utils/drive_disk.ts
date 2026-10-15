import env from '#start/env'
import { resolveDriveDisks } from '#utils/drive_disk_rules'

function driveDisks() {
  return resolveDriveDisks({
    nodeEnv: env.get('NODE_ENV'),
    driveDisk: env.get('DRIVE_DISK'),
    drivePrivateDisk: env.get('DRIVE_PRIVATE_DISK'),
  })
}

/**
 * Disk for public uploads (product photos, branding): `s3` in production.
 */
export function publicDriveDisk() {
  return driveDisks().public
}

/**
 * Disk for private uploads (payment proofs): `s3Private` in production.
 */
export function privateDriveDisk() {
  return driveDisks().private
}
