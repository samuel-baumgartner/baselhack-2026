import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
nextEnv.loadEnvConfig(process.cwd());
const sql = neon(process.env.DATABASE_URL!);
await sql`CREATE TABLE IF NOT EXISTS prism_factory_jobs (id text primary key, owner text not null, stage text not null,data jsonb not null,updated_at timestamptz not null default now())`;
await sql`CREATE TABLE IF NOT EXISTS prism_factory_sessions (id text primary key, job_id text not null,state jsonb not null,revision integer not null)`;
await sql`CREATE INDEX IF NOT EXISTS prism_factory_jobs_stage ON prism_factory_jobs(stage)`;
console.log("Factory schema ready");
