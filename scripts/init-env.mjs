import { copyFile, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
try {
  await copyFile(".env.example", ".env.local", 1);
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
let content = await readFile(".env.local", "utf8");
for (const key of [
  "BETTER_AUTH_SECRET",
  "DEMO_PASSWORD",
  "BUYER_API_KEY",
  "CALLBACK_SECRET",
]) {
  content = content.replace(
    new RegExp(`^${key}=$`, "m"),
    `${key}=${randomBytes(32).toString("hex")}`,
  );
}
await writeFile(".env.local", content, { mode: 0o600 });
console.log(
  "Local environment prepared; existing values preserved. No secrets printed.",
);
