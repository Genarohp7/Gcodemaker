require("dotenv").config();

const fs = require("fs");
const path = require("path");

const { pool } = require("./index");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations() {
  const result = await pool.query("SELECT filename FROM schema_migrations");
  return new Set(result.rows.map((row) => row.filename));
}

async function runMigration(filename, sql) {
  await pool.query("BEGIN");

  try {
    await pool.query(sql);
    await pool.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
      [filename]
    );
    await pool.query("COMMIT");
    console.log(`Migracion aplicada: ${filename}`);
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function migrate() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  await ensureMigrationsTable();
  const executedMigrations = await getExecutedMigrations();

  for (const file of files) {
    if (executedMigrations.has(file)) {
      console.log(`Migracion omitida: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await runMigration(file, sql);
  }
}

migrate()
  .then(async () => {
    console.log("Migraciones finalizadas");
    await pool.end();
  })
  .catch(async (error) => {
    console.error("Error al ejecutar migraciones");
    console.error(error);
    await pool.end();
    process.exit(1);
  });
