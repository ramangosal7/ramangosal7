#!/usr/bin/env node
/**
 * Generates the top-langs SVG using the exact same core library
 * (@stats-organization/github-readme-stats-core) that
 * readme-tools/github-readme-stats-action uses, so the output is identical.
 *
 * The action wires only PAT_1, which means its internal retryer has a single
 * token and throws MAX_RETRY as soon as that one token is rate-limited. This
 * script instead loads the same core and lets the retryer rotate through every
 * PAT_* env var provided (PAT_1 ... PAT_6). Provide at least PAT_1; adding
 * PAT_2 with GitHub's automatic GITHUB_TOKEN gives a fallback quota.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadConfigFromEnv, topLangs } from "@stats-organization/github-readme-stats-core";

// Mirrors the action's option parsing: "a=b&c=d" -> { a: "b", c: "d" }
const parseOptions = (value) => {
  const params = new URLSearchParams(value ?? "");
  return Object.fromEntries(
    [...new Set(params.keys())].map((key) => [key, params.getAll(key).join(",")]),
  );
};

const outPath = process.env.OUTPUT_PATH ?? "images/top-langs.svg";
const options = process.env.CARD_OPTIONS ?? "username=ramangosal7&layout=compact&theme=radical&langs_count=8&card_width=495&disable_animations=true&hide_progress=true";

// Load every PAT_* var from the environment so the retryer can rotate
// when one token is rate-limited instead of failing with MAX_RETRY.
loadConfigFromEnv(process.env);

const query = parseOptions(options);
if (!query.username) {
  throw new Error("username is required for the top-langs card");
}

// Second argument is the PAT override; keep it null so the retryer uses the
// full PAT_* rotation from the config we loaded above.
const result = await topLangs(query, null);
if (String(result?.status).startsWith("error")) {
  const message =
    result.error?.message ??
    result.error?.secondaryMessage ??
    result.status ??
    "unknown error";
  const type = result.error?.type ? ` [${result.error.type}]` : "";
  throw new Error(`Card generation failed: ${message}${type}`);
}
if (!result?.content) {
  throw new Error("Card renderer returned empty output.");
}

const outputPath = resolve(outPath);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, result.content, "utf8");
console.log(`Wrote ${outputPath}`);