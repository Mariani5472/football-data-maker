import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { db } from "@/database/connection.ts";

const migration = await readFile(
  path.resolve(process.cwd(), "src/database/migrations/001_initial.sql"),
  "utf8"
);

const statements = migration
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

const connection = await db.getConnection();

try {
  for (const statement of statements) {
    await connection.query(statement);
  }

  console.log("Database migrated successfully.");
} finally {
  connection.release();
  await db.end();
}