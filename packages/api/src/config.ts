/**
 * Reads an environment variable. Crashes the process if it's missing and no default is provided.
 * This ensures we never run with missing secrets.
 */
export function requireEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (value === undefined || value === "") {
    console.error(`FATAL: Required environment variable ${name} is not set. Exiting.`);
    process.exit(1);
  }
  return value;
}
