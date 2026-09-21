---
name: mail-assistant
description: Search and read the user's email using the local mail MCP server. Use when the user asks to find, inspect, summarize, or retrieve emails.
---

Use the mail MCP tools to work with the user's mailbox.

When searching for email:

1. Use `search_emails` first.
2. Return only concise email summaries initially.
3. Use `get_email` only when the user needs the full contents of a specific message.
4. Do not retrieve full bodies for many emails unnecessarily.
5. Prefer UID when referring to a specific email.

Available MCP tools:

- `search_emails`: Search emails and return summaries.
- `get_email`: Retrieve one email by UID.
- `list_mailboxes`: List available mailboxes.
