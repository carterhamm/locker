import { Pool } from "pg";
import { requireEnv } from "../config";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: requireEnv("DATABASE_URL"),
      max: 10,
    });
  }
  return pool;
}
