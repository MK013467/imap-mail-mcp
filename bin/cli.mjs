#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const command = process.argv[2];

switch (command) {
  case undefined:
  case "serve":
    await import("../dist/index.js");
    break;
  case "setup":
    process.env.IMAP_MAIL_MCP_REGISTRATION_MODE = "npx";
    await import("../scripts/setup.mjs");
    break;
  case "--help":
  case "-h":
    printHelp();
    break;
  case "--version":
  case "-v": {
    const path = fileURLToPath(new URL("../package.json", import.meta.url));
    console.log(JSON.parse(await readFile(path, "utf8")).version);
    break;
  }
  default:
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exitCode = 1;
}

function printHelp() {
  console.log(`imap-mail-mcp

Usage:
  imap-mail-mcp                 Start the MCP server
  imap-mail-mcp serve           Start the MCP server
  imap-mail-mcp setup [options] Configure an account and register clients

Setup options:
  --provider <naver|daum|kakao>
  --client <all|codex|claude>
  --dry-run
  --skip-connection-test

Other options:
  -h, --help
  -v, --version`);
}
