import { spawnSync } from "node:child_process";
import { chmod, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";
import { ImapFlow } from "imapflow";

const root = fileURLToPath(new URL("../", import.meta.url));
const envPath = fileURLToPath(new URL("../.env", import.meta.url));
const tsx = fileURLToPath(new URL("../node_modules/.bin/tsx", import.meta.url));
const entry = fileURLToPath(new URL("../src/index.ts", import.meta.url));
const providers = {
  naver: "imap.naver.com",
  daum: "imap.daum.net",
  kakao: "imap.kakao.com",
};

const flags = new Set(process.argv.slice(2));
const providerIndex = process.argv.indexOf("--provider");
const specifiedProvider =
  providerIndex >= 0 ? process.argv[providerIndex + 1] : undefined;
const dryRun = flags.has("--dry-run");
const skipConnectionTest = flags.has("--skip-connection-test");

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(tsx)) fail("Dependencies are missing. Run npm install first.");
if (providerIndex >= 0 && !specifiedProvider)
  fail("Pass naver, daum, or kakao after --provider.");
if (specifiedProvider && !Object.hasOwn(providers, specifiedProvider)) {
  fail("Choose --provider naver, daum, or kakao.");
}

const args = ["mcp", "add", "naver-mail", "--", tsx, entry];
if (dryRun) {
  console.log(
    JSON.stringify(
      { command: "codex", args, envFile: envPath, changes: false },
      null,
      2,
    ),
  );
  process.exit(0);
}

let provider = specifiedProvider;
if (!provider && stdin.isTTY) {
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    provider =
      (await prompt.question("Mail provider (naver/daum/kakao) [naver]: "))
        .trim()
        .toLowerCase() || "naver";
  } finally {
    prompt.close();
  }
}
provider ??= "naver";
if (!Object.hasOwn(providers, provider)) fail("Choose naver, daum, or kakao.");

const prefix = provider.toUpperCase();
const emailKey = `${prefix}_EMAIL`;
const passwordKey = `${prefix}_IMAP_PASSWORD`;
const original = existsSync(envPath) ? await readFile(envPath, "utf8") : "";
const existing = parse(original);
let email = existing[emailKey];
let password =
  existing[passwordKey] ??
  (provider === "naver" ? existing.NAVER_IMTP_PASSWORD : undefined);

if (!email || !password) {
  if (!stdin.isTTY)
    fail(
      `Missing ${emailKey} or ${passwordKey}. Run npm run setup in a terminal.`,
    );

  if (!email) {
    const prompt = createInterface({ input: stdin, output: stdout });
    try {
      email = (await prompt.question(`${provider} email address: `)).trim();
    } finally {
      prompt.close();
    }
  }
  if (!email?.includes("@") || /\s/.test(email))
    fail("Enter a valid email address.");
  if (!password) password = await readSecret("App password (input hidden): ");
  if (!password) fail("App password cannot be empty.");
  await saveEnv(original, { [emailKey]: email, [passwordKey]: password });
  console.log(`Saved ${provider} credentials to the local .env file.`);
} else {
  await chmod(envPath, 0o600);
  console.log(`Using existing ${provider} credentials in .env.`);
}

if (!skipConnectionTest) {
  const client = new ImapFlow({
    host: providers[provider],
    port: 993,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
    connectionTimeout: 10_000,
  });
  let connected = false;
  try {
    await client.connect();
    connected = true;
    const lock = await client.getMailboxLock("INBOX");
    lock.release();
    console.log(`${provider} IMAP connection verified.`);
  } catch (error) {
    fail(
      `IMAP connection failed: ${error.message}. Check IMAP access and the app password, then rerun setup.`,
    );
  } finally {
    if (connected) await client.logout();
  }
}

const result = spawnSync("codex", args, { stdio: "inherit", cwd: root });
if (result.error) fail(`Could not run Codex CLI: ${result.error.message}`);
if (result.status !== 0)
  fail(`Codex MCP registration failed (exit ${result.status}).`);
console.log("Setup complete. Restart Codex and check /mcp for naver-mail.");

async function saveEnv(contents, values) {
  let updated = contents;
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${JSON.stringify(value)}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    updated = pattern.test(updated)
      ? updated.replace(pattern, line)
      : `${updated}${updated && !updated.endsWith("\n") ? "\n" : ""}${line}\n`;
  }
  const temporary = `${envPath}.${process.pid}.tmp`;
  await writeFile(temporary, updated, { mode: 0o600 });
  await rename(temporary, envPath);
  await chmod(envPath, 0o600);
}

function readSecret(label) {
  return new Promise((resolve, reject) => {
    stdout.write(label);
    let value = "";
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const finish = (error) => {
      stdin.off("data", onData);
      stdin.setRawMode(Boolean(wasRaw));
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u0003")
          return finish(new Error("Setup cancelled."));
        if (character === "\u007f" || character === "\b")
          value = value.slice(0, -1);
        else if (character >= " ") value += character;
      }
    };
    stdin.on("data", onData);
  });
}
