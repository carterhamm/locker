#!/usr/bin/env node

import { Command } from "commander";
import { loginCommand } from "./commands/login";
import { logoutCommand } from "./commands/logout";
import { whoamiCommand } from "./commands/whoami";
import { getCommand } from "./commands/get";
import { setCommand } from "./commands/set";
import { listCommand } from "./commands/list";
import { revokeCommand } from "./commands/revoke";
import { updateCommand } from "./commands/update";
import { mcpInstallCommand, mcpUninstallCommand } from "./commands/mcp";

const program = new Command();

program
  .name("locker")
  .description("Secure API credential manager for AI agents")
  .version("0.1.0");

program
  .command("login")
  .description("Log in to Locker")
  .option("--register", "Create a new account")
  .option("--api <url>", "API server URL")
  .action(loginCommand);

program
  .command("logout")
  .description("Log out and clear stored token")
  .action(logoutCommand);

program
  .command("whoami")
  .description("Show the currently logged-in user")
  .action(whoamiCommand);

program
  .command("get <service>")
  .description("Retrieve an API key (prints to stdout)")
  .option("--agent <name>", "Agent identifier for audit log")
  .action(getCommand);

program
  .command("set <service> [key]")
  .description("Store an API key (prompts if key not provided)")
  .option("--stdin", "Read key from stdin")
  .action(setCommand);

program
  .command("list")
  .description("List all stored services")
  .action(listCommand);

program
  .command("revoke <service>")
  .description("Delete a stored API key")
  .action(revokeCommand);

program
  .command("replace <service> [key]")
  .description("Replace an existing API key with a new one")
  .option("--stdin", "Read key from stdin")
  .action(updateCommand);

// Self-update commands — both work
const selfUpdate = async () => {
  console.log("\u{1F504} Updating locker-cli...\n");
  const { execSync } = require("node:child_process");
  try {
    execSync("npm install -g locker-cli@latest", { stdio: "inherit" });
    console.log("\n\u2705 Locker CLI updated!");
  } catch {
    console.error("\n\u274C Update failed. Try: npm install -g locker-cli@latest");
    process.exit(1);
  }
};

program.command("update").description("Update Locker CLI to the latest version").action(selfUpdate);
program.command("upgrade").description("Update Locker CLI to the latest version").action(selfUpdate);

const mcp = program
  .command("mcp")
  .description("Manage the Locker MCP server");

mcp
  .command("install")
  .description("Install Locker MCP server into Claude Code, Cursor, etc.")
  .action(mcpInstallCommand);

mcp
  .command("uninstall")
  .description("Remove Locker MCP server from AI tools")
  .action(mcpUninstallCommand);

program.parse();
