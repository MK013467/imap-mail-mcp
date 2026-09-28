import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const tsx = fileURLToPath(new URL("../node_modules/.bin/tsx", import.meta.url));
const entry = fileURLToPath(new URL("../src/index.ts", import.meta.url));

if (!existsSync(tsx)) {
  console.error("Dependencies are missing. Run npm install first.");
  process.exit(1);
}

// Claude Code has no CLI here, so edit its user-scope config file directly.
const configPath = join(homedir(), ".claude.json");
const server = { type: "stdio", command: tsx, args: [entry], env: {} };

if (process.argv.includes("--dry-run")) {
  console.log(
    JSON.stringify(
      { file: configPath, mcpServers: { "naver-mail": server } },
      null,
      2,
    ),
  );
  process.exit(0);
}

const config = existsSync(configPath)
  ? JSON.parse(readFileSync(configPath, "utf8"))
  : {};
if (existsSync(configPath)) copyFileSync(configPath, `${configPath}.bak`);

config.mcpServers = { ...config.mcpServers, "naver-mail": server };
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, {
  mode: 0o600,
});
console.log(`Registered naver-mail in ${configPath}. Restart Claude Code.`);
