import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { products, editions, merchant } from "../lib/catalog";
loadEnvConfig(process.cwd());
const sql = neon(process.env.DATABASE_URL!);
async function main() {
  await sql`CREATE TABLE IF NOT EXISTS prism_demo_sessions (id text PRIMARY KEY, tenant text NOT NULL, revision integer NOT NULL, state jsonb NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS prism_demo_catalog (tenant text PRIMARY KEY, config jsonb NOT NULL)`;
  await sql`INSERT INTO prism_demo_catalog (tenant,config) VALUES (${merchant.id},${JSON.stringify({ merchant, products, editions })}::jsonb) ON CONFLICT (tenant) DO NOTHING`;
  console.log("Schema ready; catalogue and editions persisted.");
}
void main().catch((e) => {
  console.error(e.name);
  process.exitCode = 1;
});
