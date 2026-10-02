import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const serverName = "naver-mail";

export function isCommandAvailable(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return !result.error && result.status === 0;
}

export function detectClients() {
  return {
    codex: isCommandAvailable("codex"),
    claude: isCommandAvailable("claude"),
  };
}

export function registerCodex({ command, args }) {
  const current = spawnSync("codex", ["mcp", "get", serverName, "--json"], {
    encoding: "utf8",
  });

  if (current.status === 0) {
    try {
      const config = JSON.parse(current.stdout);
      const transport = config.transport ?? {};
      if (
        transport.type === "stdio" &&
        transport.command === command &&
        sameArray(transport.args, args)
      ) {
        return {
          client: "Codex",
          status: "skipped",
          detail: "already registered",
        };
      }
    } catch {
      // Replace an unreadable existing entry below.
    }

    run("codex", ["mcp", "remove", serverName], "Codex MCP update failed");
    run(
      "codex",
      ["mcp", "add", serverName, "--", command, ...args],
      "Codex MCP update failed",
    );
    return {
      client: "Codex",
      status: "updated",
      detail: "configuration changed",
    };
  }

  run(
    "codex",
    ["mcp", "add", serverName, "--", command, ...args],
    "Codex MCP registration failed",
  );
  return { client: "Codex", status: "registered", detail: "new entry" };
}

export function registerClaude({ command, args, home = homedir() }) {
  const configPath = join(home, ".claude.json");
  const server = { type: "stdio", command, args, env: {} };
  let config = {};

  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, "utf8"));
    } catch (error) {
      throw new Error(`Could not parse ${configPath}: ${error.message}`);
    }
  }

  if (sameServer(config.mcpServers?.[serverName], server)) {
    return {
      client: "Claude Code",
      status: "skipped",
      detail: "already registered",
      configPath,
    };
  }

  const existed = existsSync(configPath);
  if (existed) copyFileSync(configPath, `${configPath}.bak`);
  config.mcpServers = { ...config.mcpServers, [serverName]: server };
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o600,
  });

  return {
    client: "Claude Code",
    status: existed ? "updated" : "registered",
    detail: configPath,
    configPath,
  };
}

function run(command, args, label) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label} (exit ${result.status})`);
}

function sameArray(left, right) {
  return (
    Array.isArray(left) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function sameServer(left, right) {
  return (
    left?.type === right.type &&
    left.command === right.command &&
    sameArray(left.args, right.args) &&
    JSON.stringify(left.env ?? {}) === JSON.stringify(right.env)
  );
}
