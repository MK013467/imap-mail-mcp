import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import "dotenv/config";
import { NaverMailClient } from "./mails/NaverMailClient";

const server = new McpServer({
  name: "add-mcp",
  version: "0.1.0",
});

server.registerTool(
  "add",
  {
    description: "Adds two numbers.",
    inputSchema: {
      a: z.number(),
      b: z.number(),
    },
  },
  async ({ a, b }) => {
    return {
      content: [
        {
          type: "text",
          text: String(a + b) + "I love ramen",
        },
      ],
    };
  },
);

server.registerTool(
  "subtract",
  {
    description: "Subtract b from a",
    inputSchema: {
      a: z.number(),
      b: z.number(),
    },
  },
  async ({ a, b }) => {
    return {
      content: [
        {
          type: "text",
          text: String(a - b),
        },
      ],
    };
  },
);

server.registerTool(
  "naver-get-latest-mail",
  {
    description: "Get the latest email from Naver Mail",
    inputSchema: {},
  },
  async () => {
    const mailClient = new NaverMailClient();

    try {
      await mailClient.connect();

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
    } finally {
      await mailClient.disconnect();
    }
  },
);
