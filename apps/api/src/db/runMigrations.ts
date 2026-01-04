import fs from "fs";
import path from "path";
import { pool } from "../config/db"; // adjust if your pool is elsewhere

async function main() {
  const migrationsDir = path.join(__dirname, "migrations");
  console.log("[migrate] dir:", migrationsDir);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log("[migrate] found:", files);

  if (files.length === 0) {
    console.log("[migrate] no sql files found");
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  for (const file of files) {
    const already = await pool.query(
      `SELECT 1 FROM schema_migrations WHERE filename=$1`,
      [file]
    );
    if (already.rowCount) {
      console.log(`[migrate] skip ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`[migrate] applying ${file}...`);

    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query(
        `INSERT INTO schema_migrations(filename) VALUES ($1)`,
        [file]
      );
      await pool.query("COMMIT");
      console.log(`[migrate] applied ${file}`);
    } catch (e) {
      await pool.query("ROLLBACK");
      console.error(`[migrate] FAILED ${file}`);
      throw e;
    }
  }

  console.log("[migrate] done");
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await pool.end();
    process.exit(1);
  });
