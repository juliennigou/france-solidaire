import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL est absente.");

const client = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  connect_timeout: 15,
});

try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "database.migrations.completed",
    }),
  );
} finally {
  await client.end();
}
