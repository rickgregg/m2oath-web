import mysql, {
  type Pool
} from 'mysql2/promise'

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it
} from 'vitest'

const host = '127.0.0.1'
const port = 33078

const authorities = [
  {
    user: 'raven_web_user',
    password: 'raven_web_test_password',
    database: 'm2oath_web'
  },
  {
    user: 'trust_user',
    password: 'trust_test_password',
    database: 'm2oath_trust'
  },
  {
    user: 'weather_user',
    password: 'weather_test_password',
    database: 'm2oath_weather'
  }
] as const

const databases = [
  'm2oath_web',
  'm2oath_trust',
  'm2oath_weather'
] as const

const pools: Pool[] = []

async function createPool(
  user: string,
  password: string
): Promise<Pool> {
  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    connectionLimit: 1
  })

  pools.push(pool)

  return pool
}

describe(
  'MySQL authority isolation',
  () => {
    beforeAll(async () => {
      const probe = await createPool(
        'raven_web_user',
        'raven_web_test_password'
      )

      await probe.query('SELECT 1')
    })

    afterAll(async () => {
      await Promise.all(
        pools.map(
          pool => pool.end()
        )
      )
    })

    for (const authority of authorities) {
      it(
        `${authority.user} can access only ${authority.database}`,
        async () => {
          const pool = await createPool(
            authority.user,
            authority.password
          )

          for (const database of databases) {
            const query =
              `SELECT COUNT(*) FROM \`${database}\`.information_schema_placeholder`

            if (database === authority.database) {
              await expect(
                pool.query(
                  `CREATE TABLE IF NOT EXISTS
                   \`${database}\`.authority_boundary_probe (
                     id INT NOT NULL PRIMARY KEY
                   )`
                )
              ).resolves.toBeDefined()

              await expect(
                pool.query(
                  `SELECT *
                   FROM \`${database}\`.authority_boundary_probe`
                )
              ).resolves.toBeDefined()

              continue
            }

            await expect(
              pool.query(
                `SELECT *
                 FROM \`${database}\`.authority_boundary_probe`
              )
            ).rejects.toMatchObject({
              code: 'ER_TABLEACCESS_DENIED_ERROR'
            })
          }
        }
      )
    }
  }
)
