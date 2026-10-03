<p align="right">
  <strong>English</strong> | <a href="README.ko.md">한국어</a>
</p>

# IMAP Mail MCP

[![npm version](https://img.shields.io/npm/v/imap-mail-mcp.svg)](https://www.npmjs.com/package/imap-mail-mcp)

Read-only MCP server for Naver, Daum, and Kakao Mail. Works with Codex and Claude Code.

## Tools

| Tool               | Description                                    |
| ------------------ | ---------------------------------------------- |
| `search-mail`      | Search by keyword, sender, recipient, or date. |
| `get-latest-mail`  | Get the newest message.                        |
| `get-recent-mails` | List recent message summaries.                 |
| `list-mailboxes`   | List available mailboxes.                      |
| `read-mail`        | Read one message by mailbox and UID.           |
| `batch-read-mail`  | Read up to 10 messages from the same mailbox.  |

All tools support `naver`, `daum`, and `kakao`. Naver is the default provider.

## Install

Requirements:

- Node.js 20 or later
- IMAP enabled for the mail account
- An app password

Provider setup guides: [Naver](https://help.naver.com/service/30029/contents/21344?osType=COMMONOS) · [Daum](https://cs.daum.net/faq/service/43/category/9234/detail/24081) · [Daum/Kakao app passwords](https://cs.daum.net/m/faq/site/43/cat/9234/faq/33671)

Run:

```bash
npx -y imap-mail-mcp setup
```

Setup asks for a provider, email address, and app password. Password input is masked with `*`. Credentials are stored in `~/.imap-mail-mcp/.env` with owner-only permissions.

It then checks the IMAP connection and registers `naver-mail` with Codex, Claude Code, or both. Restart the client after setup. In Codex, check the registration with `/mcp`.

## Options

| Option                            | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `--provider <naver, daum, kakao>` | Configure one provider.                          |
| `--client <all, codex, claude>`   | Choose clients. Default: `all`.                  |
| `--dry-run`                       | Print the registration plan without changing it. |
| `--skip-connection-test`          | Skip the IMAP connection check.                  |

Add another provider:

```bash
npx -y imap-mail-mcp setup --provider daum
```

Saved credentials are reused. To replace them, edit `~/.imap-mail-mcp/.env` and run setup again.

The registered server command is:

```bash
npx --yes imap-mail-mcp serve
```

The command uses the latest published version available to `npx`.

## Check the setup

After restarting the client, try:

```text
List my Naver mailboxes.
Show the three most recent messages in my Naver inbox.
Find mail from a sender I know, then read the first result.
```

## Development

```bash
git clone https://github.com/MK013467/imap-mail-mcp.git
cd imap-mail-mcp
npm ci
npm run setup:local
```

`setup:local` registers the local TypeScript entry with absolute paths. Keep the checkout in the same location after registration.

```bash
npm test
npm run typecheck
npm run format:check
npm run build
```

## Limits

- The server can search and read mail. It cannot send, move, or delete messages.
- Attachment metadata is returned, but attachment contents are not.
- Messages larger than 10 MB are rejected.
- Bodies longer than 50,000 characters are truncated.

`NAVER_IMTP_PASSWORD` is accepted for compatibility. New setups use `NAVER_IMAP_PASSWORD`. Set `IMAP_MAIL_MCP_ENV_FILE` to use another credentials file.

## License

MIT
