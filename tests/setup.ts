import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
// Tests never send provider mail and use a separate database.
process.env.MAIL_TRANSPORT = "local";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://presence:presence-local-only@127.0.0.1:54329/presence_test";
