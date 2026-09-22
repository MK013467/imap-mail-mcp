---
name: mail-assistant
description: Search and read the user's email using the local mail MCP server. Use when the user asks to find, inspect, summarize, or retrieve emails.
---

Use the mail MCP tools to work with the user's mailbox.

Local setup for a fresh checkout:

1. Run `npm ci` in the project directory.
2. Ask the user to enable IMAP and create an app password in their mail provider's settings.
3. Have the user run `npm run setup` in their own terminal. It prompts for the provider, email address, and app password, stores credentials locally, checks the IMAP connection, and registers `naver-mail` with Codex.
4. Restart Codex and confirm the mail tools appear under `/mcp`.

Do not ask the user to paste an app password into chat or commit `.env` to Git. Naver, Daum, and Kakao IMAP require an app password; their ordinary sign-in OAuth flows do not provide mail access through this server.

When searching for email:

1. Use `search-mail` first when the request has a search condition; use `get-recent-mails` for recent messages.
2. Return only concise email summaries initially.
3. Use `read-mail` only when the user needs the full contents of a specific message.
4. Do not retrieve full bodies for many emails unnecessarily.
5. Include provider, mailbox, and UID when referring to a specific email.

Available MCP tools:

- `search-mail`: Search emails and return summaries.
- `get-recent-mails`: List recent email summaries.
- `read-mail`: Retrieve one email by mailbox and UID.
- `batch-read-mail`: Retrieve up to ten emails from one mailbox.
- `list-mailboxes`: List available mailboxes.
