import mysql, {
  type Pool
} from 'mysql2/promise'

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
  return mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password
  })
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
