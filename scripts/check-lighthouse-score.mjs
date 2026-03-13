import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const REQUIRED_SCORE = 100;
const [baseUrl, ...routes] = process.argv.slice(2);

if (!baseUrl || routes.length === 0) {
  console.error("Usage: node scripts/check-lighthouse-score.mjs <baseUrl> <route...>");
  process.exit(1);
}

const outputDir = mkdtempSync(join(tmpdir(), "vivance-lighthouse-"));

try {
  for (const route of routes) {
    const url = new URL(route, baseUrl).toString();
    const reportPath = join(
      outputDir,
      `${route === "/" ? "root" : route.replace(/[^a-z0-9]+/gi, "-")}.json`
    );

    const result = spawnSync(
      "npx",
      [
        "-y",
        "lighthouse",
        url,
        "--preset=desktop",
        "--quiet",
        "--chrome-flags=--headless=new --no-sandbox",
        "--only-categories=performance,accessibility,best-practices,seo",
        "--output=json",
        `--output-path=${reportPath}`,
      ],
      { encoding: "utf-8" }
    );

    if (result.error) {
      console.error(`Failed to run Lighthouse for ${url}:`, result.error.message);
      process.exit(1);
    }

    if (result.status !== 0) {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      process.exit(result.status ?? 1);
    }

    const report = JSON.parse(readFileSync(reportPath, "utf-8"));
    const scores = {
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      bestPractices: Math.round(report.categories["best-practices"].score * 100),
      seo: Math.round(report.categories.seo.score * 100),
    };

    console.log(`[lighthouse] ${route} -> ${JSON.stringify(scores)}`);

    const failures = Object.entries(scores).filter(([, score]) => score !== REQUIRED_SCORE);
    if (failures.length > 0) {
      console.error(
        `[lighthouse] ${route} failed required ${REQUIRED_SCORE}/100 scores: ${failures
          .map(([category, score]) => `${category}=${score}`)
          .join(", ")}`
      );
      process.exit(1);
    }
  }
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
