import {
  readFileSync
} from 'node:fs'
import {
  resolve
} from 'node:path'

import {
  describe,
  expect,
  it
} from 'vitest'

const repositoryRoot = resolve(
  import.meta.dirname,
  '../../..'
)

const databaseMigration = readFileSync(
  resolve(
    repositoryRoot,
    'migrations/mysql/001-create-authority-databases.sql'
  ),
  'utf8'
)

const userProvisioning = readFileSync(
  resolve(
    repositoryRoot,
    'migrations/mysql/002-provision-authority-users.sh'
  ),
  'utf8'
)

describe(
  'MySQL authority boundary',
  () => {
    it(
      'creates the three authoritative databases',
      () => {
        expect(databaseMigration).toContain(
          'CREATE DATABASE IF NOT EXISTS m2oath_web'
        )

        expect(databaseMigration).toContain(
          'CREATE DATABASE IF NOT EXISTS m2oath_trust'
        )

        expect(databaseMigration).toContain(
          'CREATE DATABASE IF NOT EXISTS m2oath_weather'
        )
      }
    )

    it.each([
      [
        'raven_web_user',
        'm2oath_web'
      ],
      [
        'trust_user',
        'm2oath_trust'
      ],
      [
        'weather_user',
        'm2oath_weather'
      ]
    ])(
      'grants %s access to only %s',
      (
        user,
        database
      ) => {
        expect(userProvisioning).toContain(
          `ON ${database}.*`
        )

        expect(userProvisioning).toContain(
          `TO '${user}'@'%'`
        )
      }
    )

    it(
      'does not contain global grants',
      () => {
        expect(userProvisioning).not.toMatch(
          /ON\s+\*\.\*/i
        )
      }
    )
  }
)
