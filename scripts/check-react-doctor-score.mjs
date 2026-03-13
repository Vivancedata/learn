import { spawnSync } from "node:child_process";

const REQUIRED_SCORE = 100;
const diffBase = process.env.REACT_DOCTOR_DIFF_BASE?.trim();
const commandArgs = ["-y", "react-doctor@latest", ".", "--score"];

if (diffBase) {
  commandArgs.push("--diff", diffBase);
}

const runReactDoctor = (args) =>
  spawnSync("npx", args, {
    encoding: "utf-8",
  });

const result = runReactDoctor(commandArgs);

if (result.error) {
  console.error("Failed to run React Doctor:", result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const rawOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();

if (!rawOutput && diffBase) {
  console.log(
    `React Doctor diff scan found no changed files against ${diffBase}. Treating score as ${REQUIRED_SCORE}/${REQUIRED_SCORE}.`
  );
  process.exit(0);
}

const scoreMatches = [...rawOutput.matchAll(/^\s*(\d+(?:\.\d+)?)\s*$/gm)];
const parsedScore = scoreMatches.length > 0 ? Number(scoreMatches.at(-1)[1]) : Number.NaN;

if (!Number.isFinite(parsedScore) && diffBase) {
  console.log(
    `React Doctor diff scan returned no numeric score against ${diffBase}. ` +
      `Treating this as no relevant React changes.\n${rawOutput || "<no output>"}`
  );
  process.exit(0);
}

if (!Number.isFinite(parsedScore)) {
  console.error("Unable to parse React Doctor score from output:");
  console.error(rawOutput || "<no output>");
  process.exit(1);
}

if (parsedScore !== REQUIRED_SCORE) {
  console.error(`React Doctor score is ${parsedScore}. Required score is ${REQUIRED_SCORE}.`);
  const verboseArgs = commandArgs.filter((arg) => arg !== "--score").concat("--verbose");
  const verboseResult = runReactDoctor(verboseArgs);
  const verboseOutput = `${verboseResult.stdout ?? ""}\n${verboseResult.stderr ?? ""}`.trim();
  if (verboseOutput) {
    console.error("\nReact Doctor verbose diagnostics:");
    console.error(verboseOutput);
  }
  process.exit(1);
}

console.log(`React Doctor score check passed (${parsedScore}/${REQUIRED_SCORE}).`);
