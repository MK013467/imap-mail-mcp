import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const tsx = fileURLToPath(new URL("../node_modules/.bin/tsx", import.meta.url));
const entry = fileURLToPath(new URL("../src/index.ts", import.meta.url));

if (!existsSync(tsx)) {
  console.error("Dependencies are missing. Run npm install first.");
  process.exit(1);
}

const args = ["mcp", "add", "naver-mail", "--", tsx, entry];
if (process.argv.includes("--dry-run")) {
  console.log(
    JSON.stringify({ command: "codex", args, project: root }, null, 2),
  );
  process.exit(0);
}

const result = spawnSync("codex", args, { stdio: "inherit" });
if (result.error) {
  console.error(`Could not run Codex CLI: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
