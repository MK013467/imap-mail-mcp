import assert from "node:assert/strict";
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
  printf '{"name":"naver-mail","transport":{"type":"stdio","command":"%s","args":["%s"]}}' "$5" "$6" > "$FAKE_CODEX_STATE"
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
      registerCodex({ tsx: "/repo/tsx", entry: "/repo/index.ts" }).status,
      "registered",
    );
    assert.equal(
      registerCodex({ tsx: "/repo/tsx", entry: "/repo/index.ts" }).status,
      "skipped",
    );
    assert.equal(
      registerCodex({ tsx: "/new/tsx", entry: "/new/index.ts" }).status,
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
    tsx: "/repo/tsx",
    entry: "/repo/index.ts",
    home,
  });
  assert.equal(created.status, "registered");
  assert.deepEqual(
    JSON.parse(readFileSync(configPath, "utf8")).mcpServers["naver-mail"],
    {
      type: "stdio",
      command: "/repo/tsx",
      args: ["/repo/index.ts"],
      env: {},
    },
  );

  const skipped = registerClaude({
    tsx: "/repo/tsx",
    entry: "/repo/index.ts",
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
    tsx: "/new/tsx",
    entry: "/new/index.ts",
    home,
  });
  assert.equal(updated.status, "updated");
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.keep, true);
  assert.equal(config.mcpServers.existing.command, "other");
  assert.equal(config.mcpServers["naver-mail"].command, "/new/tsx");
});
