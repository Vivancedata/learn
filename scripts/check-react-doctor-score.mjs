import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

/**
 * React Doctor quality ratchet.
 *
 * This gate used to require an absolute 100/100. The codebase has never scored
 * anywhere near that (main scored 42 when this was written), so the check was
 * permanently red and therefore carried no signal -- it was simply ignored,
 * which is part of why Dependabot PRs sat unmergeable for months.
 *
 * A ratchet is enforceable today: the score may not drop below the committed
 * baseline. Improvements are locked in by raising the baseline, so quality only
 * moves one way and a real regression fails a real check.
 *
 * The version is pinned deliberately -- running @latest means an upstream CLI
 * change breaks this gate with no code change on our side, which is exactly
 * what happened when react-doctor deprecated `--diff`.
 */
const REACT_DOCTOR_VERSION = "0.9.2";
const BASELINE_FILE = new URL("../.react-doctor-baseline", import.meta.url);

const readBaseline = () => {
  if (!existsSync(BASELINE_FILE)) return null;
  const n = Number(readFileSync(BASELINE_FILE, "utf-8").trim());
  return Number.isFinite(n) ? n : null;
};

const result = spawnSync(
  "npx",
  ["-y", `react-doctor@${REACT_DOCTOR_VERSION}`, ".", "--score"],
  { encoding: "utf-8" }
);

if (result.error) {
  console.error("Failed to run React Doctor:", result.error.message);
  process.exit(1);
}

const rawOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
const scoreMatches = [...rawOutput.matchAll(/^\s*(\d+(?:\.\d+)?)\s*$/gm)];
const score = scoreMatches.length > 0 ? Number(scoreMatches.at(-1)[1]) : Number.NaN;

if (!Number.isFinite(score)) {
  console.error(
    "Unable to parse a React Doctor score from output:\n" + (rawOutput || "<no output>")
  );
  process.exit(1);
}

const baseline = readBaseline();

if (baseline === null) {
  writeFileSync(BASELINE_FILE, `${score}\n`);
  console.log(`No baseline found. Recorded ${score} in .react-doctor-baseline; commit it.`);
  process.exit(0);
}

if (score < baseline) {
  console.error(
    `React Doctor score regressed: ${score} (baseline ${baseline}).\n` +
      `Fix the regression, or -- if the drop is intentional and justified -- lower ` +
      `the number in .react-doctor-baseline in the same commit, with a reason.`
  );
  process.exit(1);
}

console.log(
  score > baseline
    ? `React Doctor score improved: ${score} (baseline ${baseline}). ` +
        `Raise .react-doctor-baseline to ${score} to lock the gain in.`
    : `React Doctor score holding at ${score} (baseline ${baseline}).`
);
process.exit(0);
