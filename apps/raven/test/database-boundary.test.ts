import {
  describe,
  expect,
  it
} from 'vitest'

import {
  M2OATH_WEB_DATABASE_NAME,
  assertM2OathWebDatabaseOwnership
} from '../src/database.js'

describe(
  'Raven database authority boundary',
  () => {
    it(
      'defines the canonical Web database',
      () => {
        expect(
          M2OATH_WEB_DATABASE_NAME
        ).toBe('m2oath_web')
      }
    )

    it(
      'accepts the Web-owned database',
      () => {
        expect(
          () =>
            assertM2OathWebDatabaseOwnership(
              'm2oath_web'
            )
        ).not.toThrow()
      }
    )

    it.each([
      'm2oath_trust',
      'm2oath_weather',
      'shared',
      ''
    ])(
      'rejects database outside Raven authority: %s',
      database => {
        expect(
          () =>
            assertM2OathWebDatabaseOwnership(
              database
            )
        ).toThrow(
          'Raven must use the m2oath_web database'
        )
      }
    )
  }
)
