import { test } from '@japa/runner'
import { missingS3Settings, resolveDriveDisks } from '#utils/drive_disk_rules'

const S3_SETTINGS = {
  AWS_ACCESS_KEY_ID: 'key',
  AWS_SECRET_ACCESS_KEY: 'secret',
  AWS_REGION: 'ap-southeast-2',
  S3_BUCKET: 'akinai-public',
}

test.group('resolveDriveDisks', () => {
  test('always uses S3 in production', ({ assert }) => {
    assert.deepEqual(resolveDriveDisks({ nodeEnv: 'production' }), {
      public: 's3',
      private: 's3Private',
    })
    assert.deepEqual(
      resolveDriveDisks({ nodeEnv: 'production', driveDisk: 'fs', drivePrivateDisk: 'fsPrivate' }),
      { public: 's3', private: 's3Private' }
    )
  })

  test('defaults to the local disks outside production', ({ assert }) => {
    assert.deepEqual(resolveDriveDisks({ nodeEnv: 'development' }), {
      public: 'fs',
      private: 'fsPrivate',
    })
    assert.deepEqual(resolveDriveDisks({ nodeEnv: 'test', driveDisk: 'fs' }), {
      public: 'fs',
      private: 'fsPrivate',
    })
  })

  test('follows DRIVE_DISK outside production', ({ assert }) => {
    assert.deepEqual(resolveDriveDisks({ nodeEnv: 'development', driveDisk: 's3' }), {
      public: 's3',
      private: 's3Private',
    })
  })

  test('lets DRIVE_PRIVATE_DISK override the private disk outside production', ({ assert }) => {
    assert.deepEqual(
      resolveDriveDisks({ nodeEnv: 'development', driveDisk: 's3', drivePrivateDisk: 'fsPrivate' }),
      { public: 's3', private: 'fsPrivate' }
    )
  })
})

test.group('missingS3Settings', () => {
  test('passes when every setting is present', ({ assert }) => {
    assert.deepEqual(missingS3Settings(S3_SETTINGS), [])
  })

  test('lists missing and blank settings', ({ assert }) => {
    assert.deepEqual(
      missingS3Settings({ ...S3_SETTINGS, AWS_REGION: undefined, S3_BUCKET: '  ' }),
      ['AWS_REGION', 'S3_BUCKET']
    )
  })
})
