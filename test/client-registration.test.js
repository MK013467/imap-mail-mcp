import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  registerClaude,
  registerCodex,
} from "../scripts/client-registration.mjs";

test("Codex registration creates, skips, and updates its MCP entry", () => {
  const directory = mkdtempSync(join(tmpdir(), "imtpmail-codex-"));
  const executable = join(directory, "codex");
  const state = join(directory, "state.json");
  writeFileSync(
    executable,
    `#!/bin/sh
if [ "$1" = "--version" ]; then exit 0; fi
if [ "$2" = "get" ]; then
  if [ ! -f "$FAKE_CODEX_STATE" ]; then exit 1; fi
  cat "$FAKE_CODEX_STATE"
  exit 0
fi
if [ "$2" = "remove" ]; then rm -f "$FAKE_CODEX_STATE"; exit 0; fi
if [ "$2" = "add" ]; then
  if [ "$5" = "npx" ]; then
    printf '{"name":"naver-mail","transport":{"type":"stdio","command":"%s","args":["%s","%s","%s"]}}' "$5" "$6" "$7" "$8" > "$FAKE_CODEX_STATE"
  else
    printf '{"name":"naver-mail","transport":{"type":"stdio","command":"%s","args":["%s"]}}' "$5" "$6" > "$FAKE_CODEX_STATE"
  fi
  exit 0
fi
exit 1
`,
  );
  chmodSync(executable, 0o755);

  const originalPath = process.env.PATH;
  process.env.PATH = `${directory}:${originalPath}`;
  process.env.FAKE_CODEX_STATE = state;
  try {
    assert.equal(
      registerCodex({
        command: "npx",
        args: ["--yes", "imap-mail-mcp", "serve"],
      }).status,
      "registered",
    );
    assert.equal(
      registerCodex({
        command: "npx",
        args: ["--yes", "imap-mail-mcp", "serve"],
      }).status,
      "skipped",
    );
    assert.equal(
      registerCodex({ command: "node", args: ["/new/index.js"] }).status,
      "updated",
    );
  } finally {
    process.env.PATH = originalPath;
    delete process.env.FAKE_CODEX_STATE;
  }
});

test("Claude registration creates, skips, and updates its MCP entry", () => {
  const home = mkdtempSync(join(tmpdir(), "imtpmail-claude-"));
  const configPath = join(home, ".claude.json");

  const created = registerClaude({
    command: "npx",
    args: ["--yes", "imap-mail-mcp", "serve"],
    home,
  });
  assert.equal(created.status, "registered");
  assert.deepEqual(
    JSON.parse(readFileSync(configPath, "utf8")).mcpServers["naver-mail"],
    {
      type: "stdio",
      command: "npx",
      args: ["--yes", "imap-mail-mcp", "serve"],
      env: {},
    },
  );

  const skipped = registerClaude({
    command: "npx",
    args: ["--yes", "imap-mail-mcp", "serve"],
    home,
  });
  assert.equal(skipped.status, "skipped");

  writeFileSync(
    configPath,
    JSON.stringify({
      keep: true,
      mcpServers: { existing: { command: "other" } },
    }),
  );
  const updated = registerClaude({
    command: "node",
    args: ["/new/index.js"],
    home,
  });
  assert.equal(updated.status, "updated");
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.keep, true);
  assert.equal(config.mcpServers.existing.command, "other");
  assert.equal(config.mcpServers["naver-mail"].command, "node");
});

test("CLI exposes help and version", () => {
  const help = spawnSync(process.execPath, ["./bin/cli.mjs", "--help"], {
    encoding: "utf8",
  });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /imap-mail-mcp setup/);

  const { version: expectedVersion } = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  const version = spawnSync(process.execPath, ["./bin/cli.mjs", "--version"], {
    encoding: "utf8",
  });
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), expectedVersion);
});
