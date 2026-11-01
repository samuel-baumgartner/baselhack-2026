import { neon } from "@neondatabase/serverless";
const database=neon(process.env.DATABASE_URL!);
await database`CREATE TABLE IF NOT EXISTS prism_krafft_sessions (id text PRIMARY KEY, state jsonb NOT NULL, revision integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now())`;
console.log("Krafft durable session table is ready.");
