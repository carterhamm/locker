#!/usr/bin/env node

import { Command } from "commander";
import { loginCommand } from "./commands/login";
import { logoutCommand } from "./commands/logout";
import { whoamiCommand } from "./commands/whoami";
import { getCommand } from "./commands/get";
import { setCommand } from "./commands/set";
import { listCommand } from "./commands/list";
import { revokeCommand } from "./commands/revoke";

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
  .command("set <service> <key>")
  .description("Store an API key")
  .action(setCommand);

program
  .command("list")
  .description("List all stored services")
  .action(listCommand);

program
  .command("revoke <service>")
  .description("Delete a stored API key")
  .action(revokeCommand);

program.parse();
