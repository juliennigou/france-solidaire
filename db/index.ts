import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type SqlClient = ReturnType<typeof postgres>;

const globalForDatabase = globalThis as typeof globalThis & {
  franceSolidaireSql?: SqlClient;
};

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL est absente.");
  }
  return url;
}

export function getSql() {
  if (!globalForDatabase.franceSolidaireSql) {
    globalForDatabase.franceSolidaireSql = postgres(databaseUrl(), {
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return globalForDatabase.franceSolidaireSql;
}

export function getDb() {
  return drizzle(getSql(), { schema });
}
