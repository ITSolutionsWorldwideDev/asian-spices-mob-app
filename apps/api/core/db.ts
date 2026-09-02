import { Pool, type QueryResult, type QueryResultRow } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return connectionString;
}

function createPool() {
  const connectionString = getConnectionString();

  return new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
    max: 3,
    // Fail fast instead of hanging forever when the pool is exhausted.
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });
}

export const pool = globalForDb.pgPool ?? createPool();

// if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
// }

export async function runQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export function buildInsertQuery(
  table: string,
  record: Record<string, unknown>,
) {
  const entries = Object.entries(record).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);
  const placeholders = entries.map((_, index) => `$${index + 1}`);

  return {
    text: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
    values,
  };
}
