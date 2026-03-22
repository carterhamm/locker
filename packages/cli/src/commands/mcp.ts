import fs from "node:fs";
import path from "node:path";
import os from "node:os";

interface McpConfig {
  mcpServers?: Record<string, { command: string; args: string[] }>;
  [key: string]: unknown;
}

const TARGETS: Record<string, string> = {
  claude: path.join(os.homedir(), ".claude", "claude_desktop_config.json"),
  cursor: path.join(os.homedir(), ".cursor", "mcp.json"),
};

function getMcpEntry() {
  // Resolve the actual path to the MCP server entry point
  const mcpPkg = path.resolve(__dirname, "..", "..", "..", "mcp");
  const mcpEntry = path.join(mcpPkg, "src", "index.ts");
  const mcpDist = path.join(mcpPkg, "dist", "index.js");

  // Prefer dist if built, otherwise use tsx with source
  if (fs.existsSync(mcpDist)) {
    return { command: "node", args: [mcpDist] };
  }
  return { command: "npx", args: ["tsx", mcpEntry] };
}

function installToTarget(name: string, configPath: string): boolean {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let config: McpConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch {
      console.error(`  Could not parse ${configPath}`);
      return false;
    }
  }

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  const entry = getMcpEntry();
  config.mcpServers.locker = entry;

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  console.log(`  ✓ ${name} — ${configPath}`);
  return true;
}

export function mcpInstallCommand() {
  console.log("Installing Locker MCP server...\n");

  let installed = 0;
  for (const [name, configPath] of Object.entries(TARGETS)) {
    const dir = path.dirname(configPath);
    // Only install if the tool's config directory exists (tool is installed)
    if (fs.existsSync(dir) || name === "claude") {
      if (installToTarget(name, configPath)) installed++;
    }
  }

  if (installed === 0) {
    console.log("No supported AI tools detected.");
    console.log("Manually add to your tool's MCP config:");
    const entry = getMcpEntry();
    console.log(JSON.stringify({ locker: entry }, null, 2));
  } else {
    console.log(`\nDone. Restart your AI tool to activate.`);
  }
}

export function mcpUninstallCommand() {
  console.log("Removing Locker MCP server...\n");

  for (const [name, configPath] of Object.entries(TARGETS)) {
    if (!fs.existsSync(configPath)) continue;
    try {
      const config: McpConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.mcpServers?.locker) {
        delete config.mcpServers.locker;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
        console.log(`  ✓ Removed from ${name}`);
      }
    } catch {
      // Skip
    }
  }
  console.log("\nDone.");
}
