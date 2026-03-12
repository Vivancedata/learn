import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const cwd = process.cwd();
const localCacheHome = path.join(cwd, ".cache");
const localPrismaCache = path.join(localCacheHome, "prisma");
const sharedPrismaCache = path.join(os.homedir(), ".cache", "prisma");

mkdirSync(localPrismaCache, { recursive: true });

// Keep Prisma's engine cache project-local so generate works even if the shared
// cache has read-only entries. Seed from the shared cache when available.
if (
  existsSync(sharedPrismaCache) &&
  !existsSync(path.join(localPrismaCache, "master"))
) {
  cpSync(sharedPrismaCache, localPrismaCache, {
    recursive: true,
    force: false,
  });
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["prisma", "generate"], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    XDG_CACHE_HOME: localCacheHome,
  },
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
