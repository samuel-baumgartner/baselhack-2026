import { pool } from "../src/server/db";
import { config } from "../src/server/config";
import { DEMO_TENANT, DEMO_EMAIL } from "../src/lib/contracts";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";

const hash = await hashPassword(config().DEMO_PASSWORD);
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM "user" WHERE email=$1',
    [DEMO_EMAIL],
  );
  const userId = existing.rows[0]?.id ?? randomUUID();
  await client.query(
    'INSERT INTO "user" (id,name,email,"emailVerified") VALUES ($1,$2,$3,true) ON CONFLICT (email) DO NOTHING',
    [userId, "Demo presenter", DEMO_EMAIL],
  );
  await client.query(
    'INSERT INTO account (id,"accountId","providerId","userId",password) VALUES ($1,$2,$3,$2,$4) ON CONFLICT ("providerId","accountId") DO UPDATE SET password=excluded.password',
    [randomUUID(), userId, "credential", hash],
  );
  await client.query(
    "INSERT INTO tenants (id,slug,name,seeded) VALUES ($1,$2,$3,true) ON CONFLICT (id) DO NOTHING",
    [DEMO_TENANT, "hotel-linden-basel", "Hotel Linden Basel"],
  );
  await client.query(
    "INSERT INTO owner_memberships (user_id,tenant_id,role) VALUES ($1,$2,$3) ON CONFLICT (user_id,tenant_id) DO NOTHING",
    [userId, DEMO_TENANT, "operator"],
  );
  for (const day of ["2030-11-12", "2030-11-13"])
    await client.query(
      "INSERT INTO inventory (tenant_id,day,remaining) VALUES ($1,$2,1) ON CONFLICT (tenant_id,day) DO NOTHING",
      [DEMO_TENANT, day],
    );
  await client.query("COMMIT");
  console.log("Fictional hotel, scoped presenter and inventory are ready.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
