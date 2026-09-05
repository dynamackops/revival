import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const bundleRoot = join(process.cwd(), "apps", "web", "dist");
const forbidden = /SUPABASE_(?:SERVICE_ROLE|SECRET)_KEY|sb_secret_[A-Za-z0-9_-]{20,}|NEBIUS_TOKEN_FACTORY_API_KEY|GITHUB_APP_PRIVATE_KEY/g;

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(path)));
    else files.push(path);
  }

  return files;
}

for (const file of await filesUnder(bundleRoot)) {
  const contents = await readFile(file, "utf8");
  if (forbidden.test(contents)) {
    console.error(`Server-only credential material detected in browser bundle: ${file}`);
    process.exit(1);
  }
  forbidden.lastIndex = 0;
}

console.log("Browser bundle contains no server-only credential material.");
