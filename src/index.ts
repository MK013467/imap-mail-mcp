#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ImapMailClient } from "./mails/ImapMailClient.js";
import { getImapAccount } from "./mails/accounts.js";
import type { MailProvider } from "./mails/types.js";

const userEnvPath = join(homedir(), ".imap-mail-mcp", ".env");
const envPath =
  process.env.IMAP_MAIL_MCP_ENV_FILE ??
  (existsSync(userEnvPath) ? userEnvPath : join(process.cwd(), ".env"));
config({ path: envPath, quiet: true });

const server = new McpServer({
  name: "mail-imap",
  version: "0.1.0",
});

async function withMailClient<T>(
  provider: MailProvider,
  action: (client: ImapMailClient) => Promise<T>,
): Promise<T> {
  const client = new ImapMailClient(getImapAccount(provider));
  await client.connect();
  try {
    return await action(client);
  } finally {
    await client.disconnect();
  }
}

server.registerTool(
  "get-latest-mail",
  {
    description: "Get the latest email from an IMAP mail account",
    inputSchema: {
      provider: z.enum(["naver", "daum", "kakao"]).default("naver"),
    },
  },
  async ({ provider }) => {
    return withMailClient(provider, async (mailClient) => {
      const email = await mailClient.getLatestEmail();
      if (!email) {
        return {
          content: [
            {
              type: "text",
              text: "No email found",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(email),
          },
        ],
      };
    });
  },
);

server.registerTool(
  "get-recent-mails",
  {
    description:
      "List the newest email summaries from a mailbox without reading bodies.",
    inputSchema: {
      provider: z.enum(["naver", "daum", "kakao"]).default("naver"),
      mailbox: z.string().min(1).default("INBOX"),
      limit: z.number().int().min(1).max(100).default(10),
    },
  },
  async ({ provider, mailbox, limit }) =>
    withMailClient(provider, async (client) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await client.getRecentEmails(limit, mailbox)),
        },
      ],
    })),
);

server.registerTool(
  "list-mailboxes",
  {
    description:
      "List selectable mailboxes and their paths for the chosen account.",
    inputSchema: {
      provider: z.enum(["naver", "daum", "kakao"]).default("naver"),
    },
  },
  async ({ provider }) =>
    withMailClient(provider, async (client) => ({
      content: [
        { type: "text", text: JSON.stringify(await client.listMailboxes()) },
      ],
    })),
);

server.registerTool(
  "read-mail",
  {
    description:
      "Read one email by mailbox path and UID, including body and attachment metadata. This does not return attachment contents.",
    inputSchema: {
      provider: z.enum(["naver", "daum", "kakao"]).default("naver"),
      mailbox: z.string().min(1).default("INBOX"),
      uid: z.number().int().positive(),
    },
  },
  async ({ provider, mailbox, uid }) =>
    withMailClient(provider, async (client) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await client.readEmail(mailbox, uid)),
        },
      ],
    })),
);

server.registerTool(
  "batch-read-mail",
  {
    description:
      "Read up to 10 emails from the same mailbox by UID, preserving input order. Missing messages return null.",
    inputSchema: {
      provider: z.enum(["naver", "daum", "kakao"]).default("naver"),
      mailbox: z.string().min(1).default("INBOX"),
      uids: z.array(z.number().int().positive()).min(1).max(10),
    },
  },
  async ({ provider, mailbox, uids }) =>
    withMailClient(provider, async (client) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await client.readEmails(mailbox, uids)),
        },
      ],
    })),
);

server.registerTool(
  "search-mail",
  {
    description:
      "Search Naver, Daum, or Kakao Mail. A plain query searches message headers and body; optional filters narrow the results. Results contain provider, mailbox, and UID for locating each message.",
    inputSchema: {
      provider: z.enum(["naver", "daum", "kakao"]).default("naver"),
      query: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Keyword, as in the mail search box"),
      field: z
        .enum(["all", "subject", "from", "to", "body"])
        .default("all")
        .describe("Where to search for query"),
      from: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Sender address or name contains"),
      to: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Recipient address or name contains"),
      since: z.iso
        .date()
        .optional()
        .describe("Received on or after YYYY-MM-DD"),
      before: z.iso
        .date()
        .optional()
        .describe("Received before YYYY-MM-DD (exclusive)"),
      scope: z
        .enum(["inbox", "all"])
        .default("inbox")
        .describe("Search INBOX or all selectable mail folders"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(50)
        .describe("Maximum number of newest results"),
    },
  },
  async ({ provider, query, field, from, to, since, before, scope, limit }) => {
    if (!query && !from && !to && !since && !before) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Provide a query or at least one search filter.",
          },
        ],
      };
    }
    if (since && before && since >= before) {
      return {
        isError: true,
        content: [{ type: "text", text: "before must be later than since." }],
      };
    }
    if (query && ((field === "from" && from) || (field === "to" && to))) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Use either query with field from/to or the matching from/to filter.",
          },
        ],
      };
    }
    return withMailClient(provider, async (mailClient) => {
      const emails = await mailClient.searchEmails({
        query,
        field,
        from,
        to,
        since,
        before,
        scope,
        limit,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(emails) }],
      };
    });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
