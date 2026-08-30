import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";

// Cloudflare Workers Builds may restore old framework output before the deploy
// command runs. Remove the generated Wrangler redirect and previous static
// export so deployment can never reuse a stale Vinext/Vite entry point.
await Promise.all([
  rm(".wrangler", { recursive: true, force: true }),
  rm("out", { recursive: true, force: true }),
]);

console.log("Cleared stale Cloudflare deployment output.");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCommand, ["run", "build"], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

console.log("Fresh static export ready in out/.");
