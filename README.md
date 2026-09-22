# IMAP Mail MCP demo

This project provides a Codex MCP server for searching Naver, Daum, and Kakao Mail over IMAP.

## Setup

1. Download or clone this repository and run `npm ci`.
2. In your mail provider's web settings, enable IMAP, enable two-step verification, and create an app password.
3. Run `npm run setup` in a terminal. Choose Naver, Daum, or Kakao, then enter the mail address and app password once. Setup saves them to a local `.env` file, verifies the IMAP connection, and registers the MCP server with Codex.
4. Restart Codex, then check `/mcp` for the `naver-mail` entry and its mail tools. The registration name is retained for compatibility; the server itself supports all three providers.

Provider instructions: [Naver IMAP setup](https://help.naver.com/service/30029/contents/21344?osType=COMMONOS), [Daum IMAP setup](https://cs.daum.net/faq/service/43/category/9234/detail/24081), and [Daum/Kakao app passwords](https://cs.daum.net/m/faq/site/43/cat/9234/faq/33671). These providers require an app password for IMAP access, so the local setup asks for it once.

To add another account later, run `npm run setup -- --provider daum` or `npm run setup -- --provider kakao`. Existing account credentials are reused. Setup keeps the app password out of terminal output and stores `.env` with owner-only file permissions. You can inspect its planned registration without making changes using `npm run setup -- --dry-run`. If IMAP is temporarily unreachable, `npm run setup -- --skip-connection-test` registers without testing the connection.

Registration uses absolute paths to this checkout. Keep the project at the same location after registering. `.env` is ignored by Git. The existing `NAVER_IMTP_PASSWORD` variable is still accepted for compatibility; new setups use `NAVER_IMAP_PASSWORD`.

## Search mail

The `search-mail` tool accepts a `query` like a mail search box. By default it searches message headers and body in the Naver `INBOX` and returns up to 50 newest summaries.

- `provider`: `naver` (default), `daum`, or `kakao`. The selected account must be configured in `.env`.
- `field`: `all` (default), `subject`, `from`, `to`, or `body` selects where `query` is matched.
- `from` and `to`: additional sender and recipient filters.
- `since` and `before`: received-date bounds in `YYYY-MM-DD`; `before` is exclusive.
- `scope`: `inbox` (default) or `all` selectable folders.
- `limit`: 1–100 results. Each result includes `provider`, `mailbox`, and the folder-specific `uid`.

Supply a `query` or at least one filter. For example, search `{ "query": "회의", "field": "subject", "from": "example@naver.com", "scope": "all" }` for messages whose subject contains `회의` from that sender across folders.

`get-latest-mail` also accepts `provider` and defaults to Naver. Enable IMAP for each account and use an app password where the mail provider requires one.

## Read mail

All tools default to the Naver account. Search and recent-mail results include `provider`, `mailbox`, and `uid`; use those values to read a specific message.

- `get-recent-mails`: return up to 100 newest summaries from a mailbox (`INBOX` by default).
- `list-mailboxes`: list selectable mailbox paths.
- `read-mail`: read one message by `mailbox` and `uid`, returning sender, recipients, body, and attachment metadata.
- `batch-read-mail`: read up to 10 UIDs from one mailbox in input order. Missing messages appear as `null`.

The read tools do not return attachment contents. They refuse messages larger than 10 MB and truncate displayed bodies after 50,000 characters, reporting truncation in `bodyTruncated`.
