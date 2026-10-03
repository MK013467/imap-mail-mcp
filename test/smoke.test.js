// 서버가 실제로 기동해 MCP 핸드셰이크를 마치고 툴을 노출하는지 확인한다.
// initialize와 tools/list는 IMAP에 접속하지 않으므로 자격증명 없이 실행된다.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const REQUIRED_TOOLS = [
  "search-mail",
  "read-mail",
  "batch-read-mail",
  "list-mailboxes",
  "get-recent-mails",
  "get-latest-mail",
];

/** 서버를 띄워 tools/list 응답의 툴 이름 목록을 돌려준다. */
function listTools(
  command = "./node_modules/.bin/tsx",
  args = ["./src/index.ts"],
) {
  return new Promise((resolve, reject) => {
    const server = spawn(command, args, { stdio: ["pipe", "pipe", "inherit"] });
    const timer = setTimeout(() => {
      server.kill();
      reject(new Error("서버가 10초 안에 응답하지 않았습니다."));
    }, 10_000);

    const done = (error, value) => {
      clearTimeout(timer);
      server.kill();
      error ? reject(error) : resolve(value);
    };

    server.on("error", (error) => done(error));

    const send = (message) =>
      server.stdin.write(`${JSON.stringify(message)}\n`);
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "smoke-test", version: "0" },
      },
    });
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    send({ jsonrpc: "2.0", id: 2, method: "tools/list" });

    let buffer = "";
    server.stdout.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const message = JSON.parse(line);
        if (message.id === 2)
          done(
            null,
            message.result.tools.map((t) => t.name),
          );
      }
    });
  });
}

let tools;
before(async () => {
  tools = await listTools();
});

test("MCP handshake and tools", () => {
  assert.ok(tools.length > 0, "No tools in this server.");
});

test("Mail tool registered", () => {
  for (const name of REQUIRED_TOOLS) {
    assert.ok(tools.includes(name), `empty tools: ${name}`);
  }
});

test("Build server display mcp", async () => {
  const builtTools = await listTools("node", ["./dist/index.js"]);

  assert.ok(builtTools.length > 0, "No tools in this server.");
  for (const name of REQUIRED_TOOLS) {
    assert.ok(builtTools.includes(name), `empty tools: ${name}`);
  }
});
