#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { requireConfig } from "./config";
import { getKey, listServices } from "./api";

const server = new McpServer({
  name: "locker",
  version: "0.1.0",
});

// ── Tool: locker_get ──
// Retrieves a decrypted API key for a given service.
server.tool(
  "locker_get",
  "Retrieve an API key from Locker. Returns the decrypted key for the specified service. The retrieval is logged in the audit trail.",
  {
    service: z.string().describe("The service name (e.g. 'openai', 'resend', 'stripe')"),
    agent: z.string().optional().describe("Agent identifier for the audit log (defaults to 'mcp-server')"),
  },
  async ({ service, agent }) => {
    try {
      const config = requireConfig();
      const result = await getKey(config, service, agent || "mcp-server");

      return {
        content: [
          {
            type: "text" as const,
            text: result.key,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${err.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ── Tool: locker_list ──
// Lists all stored service names (never exposes key values).
server.tool(
  "locker_list",
  "List all services that have API keys stored in Locker. Returns service names only — never the actual key values.",
  {},
  async () => {
    try {
      const config = requireConfig();
      const services = await listServices(config);

      if (services.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No keys stored in Locker. Store one with: locker set <service> <key>",
            },
          ],
        };
      }

      const lines = services.map((s) => {
        const lastUsed = s.lastUsed
          ? `last used ${new Date(s.lastUsed).toLocaleDateString()}`
          : "never used";
        return `  ${s.service} (${lastUsed})`;
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `${services.length} key${services.length === 1 ? "" : "s"} stored:\n${lines.join("\n")}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${err.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ── Start server ──
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
