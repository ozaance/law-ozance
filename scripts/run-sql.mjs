// Exécute un fichier .sql sur la base via DATABASE_URL.
// Usage : node scripts/run-sql.mjs supabase/schema.sql
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/run-sql.mjs <fichier.sql>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL manquant (à mettre dans .env.local).");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`✅ ${file} exécuté avec succès.`);
} catch (err) {
  console.error("❌ Erreur SQL :", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
