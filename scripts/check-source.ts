import { fetchSource } from "../src/server/adapters/source";
import { DEMO_SOURCE_URL } from "../src/lib/contracts";
import { pool } from "../src/server/db";
const source = await fetchSource(process.argv[2] || DEMO_SOURCE_URL);
console.log(
  JSON.stringify({
    url: source.url,
    characters: source.text.length,
    hasHotelName: source.text.includes("Rheinfelderhof"),
    hasContactAddress: source.text.includes("Hammerstrasse"),
    trustedFixture: source.trustedFixture,
  }),
);
await pool.end();
