import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CONFIG_DIR = path.join(os.homedir(), ".locker");
const CONFIG_FILE = path.join(CONFIG_DIR, "config");

export interface LockerConfig {
  token: string;
  email: string;
  apiUrl: string;
}

/**
 * Reads the stored config from ~/.locker/config.
 * Returns null if no config exists.
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
 * Writes config to ~/.locker/config with chmod 600 (owner-only read/write).
 * Creates ~/.locker directory if it doesn't exist.
 */
export function writeConfig(config: LockerConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { mode: 0o700 });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    mode: 0o600,
  });
}

/**
 * Deletes ~/.locker/config (logout).
 */
export function clearConfig(): void {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  } catch {
    // Ignore — file may not exist
  }
}

/**
 * Returns the config or exits with a helpful message if not logged in.
 */
export function requireAuth(): LockerConfig {
  const config = readConfig();
  if (!config) {
    console.error("Not logged in. Run: locker login");
    process.exit(1);
  }
  return config;
}
