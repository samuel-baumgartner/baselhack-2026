import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config";
import * as schema from "./schema";

const globalDb = globalThis as unknown as { presencePool?: Pool };
export const pool =
  globalDb.presencePool ??
  new Pool({ connectionString: config().DATABASE_URL, max: 8 });
if (process.env.NODE_ENV !== "production") globalDb.presencePool = pool;
export const db = drizzle(pool, { schema, casing: "snake_case" });
