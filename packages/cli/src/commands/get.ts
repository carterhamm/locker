import { requireAuth } from "../auth/config";
import { apiRequest } from "../auth/client";

export async function getCommand(rawService: string, options: { agent?: string }) {
  const service = rawService.toLowerCase().trim();
  const config = requireAuth();

  const headers: Record<string, string> = {};
  if (options.agent) {
    headers["X-Agent-Identifier"] = options.agent;
  }

  const res = await apiRequest<{ service: string; key: string }>(
    "GET",
    `/keys/${encodeURIComponent(service)}`,
    config,
    undefined,
    headers
  );

  if (!res.ok) {
    if (res.status === 404) {
      console.error(`No key found for service: ${service}`);
      console.error(`Store one with: locker set ${service} <key>`);
      process.exit(1);
    }
    console.error(res.data.error || "Failed to retrieve key.");
    process.exit(1);
  }

  // Print key to stdout only — no extra formatting, no logging to disk
  process.stdout.write(res.data.key);
}
