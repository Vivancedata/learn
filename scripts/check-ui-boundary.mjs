#!/usr/bin/env node

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiDirectory = path.join(repoRoot, "src/components/ui");
const allowedLocalFiles = new Set(["navbar.tsx", "sidebar.tsx", "user-button.tsx"]);
const violations = [];

for (const filePath of walkFiles(uiDirectory)) {
  const relativePath = path.relative(uiDirectory, filePath);

  if (!/\.(ts|tsx)$/.test(relativePath)) {
    continue;
  }

  if (allowedLocalFiles.has(relativePath)) {
    continue;
  }

  const source = readFileSync(filePath, "utf8");

  if (!isThinUiReExport(source)) {
    violations.push(relativePath);
  }
}

if (violations.length > 0) {
  console.error('UI boundary check failed for "learn".');
  console.error(
    'Files in src/components/ui must either re-export from "@vivancedata/ui" or be explicitly allowlisted as app-specific.'
  );
  console.error("");
  console.error("Violations:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  console.error("");
  console.error("Allowed app-specific files:");
  for (const fileName of allowedLocalFiles) {
    console.error(`- ${fileName}`);
  }
  process.exit(1);
}

console.log('UI boundary check passed for "learn".');

function walkFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function isThinUiReExport(source) {
  const stripped = stripComments(source).trim();
  const withoutUseClient = stripped.replace(/^["']use client["'];?\s*/, "").trim();

  if (!withoutUseClient) {
    return false;
  }

  return /^(export\s+(type\s+)?\{[\s\S]*?\}\s+from\s+["']@vivancedata\/ui["'];?\s*)+$/.test(withoutUseClient);
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}
