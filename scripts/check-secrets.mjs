import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".venv",
  "node_modules",
  "dist",
  "coverage",
  ".vite",
  ".pytest_cache",
  ".ruff_cache",
]);
const ignoredFiles = new Set([".env.example", "pnpm-lock.yaml", "uv.lock"]);
const readableExtensions = new Set([
  ".js",
  ".mjs",
  ".ts",
  ".tsx",
  ".json",
  ".py",
  ".toml",
  ".yaml",
  ".yml",
  ".md",
]);
const suspiciousPatterns = [
  ["GitHub token", /gh[pousr]_[A-Za-z0-9_]{20,}/g],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["Nebius-style API key assignment", /NEBIUS_TOKEN_FACTORY_API_KEY\s*=\s*[^\s#][^\r\n]*/g],
  ["Supabase service-role assignment", /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s#][^\r\n]*/g],
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
      continue;
    }
    if (ignoredFiles.has(entry.name)) continue;
    if (readableExtensions.has(extname(entry.name))) files.push(absolutePath);
  }

  return files;
}

const findings = [];
for (const file of await collectFiles(root)) {
  const contents = await readFile(file, "utf8");
  for (const [label, pattern] of suspiciousPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(contents)) {
      findings.push(label + " in " + relative(root, file));
    }
  }
}

if (findings.length > 0) {
  console.error("Potential committed secrets detected:");
  for (const finding of findings) console.error("- " + finding);
  process.exit(1);
}

console.log("Secret scan passed.");
