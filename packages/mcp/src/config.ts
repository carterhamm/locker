import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CONFIG_FILE = path.join(os.homedir(), ".locker", "config");

export interface LockerConfig {
  token: string;
  email: string;
  apiUrl: string;
}

/**
 * Reads the Locker CLI config from ~/.locker/config.
 * This is the same file the CLI writes after `locker login`.
 * Returns null if not found or invalid.
 */
export function readConfig(): LockerConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.token || !parsed.email || !parsed.apiUrl) return null;
    return parsed as LockerConfig;
  } catch {
    return null;
  }
}

/**
 * Returns config or throws with a helpful message.
 */
export function requireConfig(): LockerConfig {
  const config = readConfig();
  if (!config) {
    throw new Error(
      "Not logged in to Locker. Run `locker login` first to authenticate."
    );
  }
  return config;
}
