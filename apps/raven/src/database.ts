import mysql, {
  type Pool
} from 'mysql2/promise'

export const M2OATH_WEB_DATABASE_NAME =
  'm2oath_web'

export interface M2OathWebDatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}

export function createM2OathWebDatabasePool(
  config: M2OathWebDatabaseConfig
): Pool {
  assertM2OathWebDatabaseOwnership(
    config.database
  )

  return mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password
  })
}

export function assertM2OathWebDatabaseOwnership(
  database: string
): void {
  const normalized =
    database.trim()

  if (
    normalized !==
    M2OATH_WEB_DATABASE_NAME
  ) {
    throw new Error(
      `Raven must use the ${M2OATH_WEB_DATABASE_NAME} database; configured database: ${normalized || '<empty>'}`
    )
  }
}

export async function checkM2OathWebDatabaseConnection(
  pool: Pool
): Promise<void> {
  const connection =
    await pool.getConnection()

  try {
    await connection.ping()
  } finally {
    connection.release()
  }
}

export type {
  Pool
}
