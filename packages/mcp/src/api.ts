import { LockerConfig } from "./config";

export interface KeyResponse {
  service: string;
  key: string;
}

export interface ServiceListItem {
  service: string;
  createdAt: string;
  lastUsed: string | null;
}

/**
 * Retrieves a decrypted API key from the Locker API.
 * Sends the agent identifier for audit logging.
 */
export async function getKey(
  config: LockerConfig,
  service: string,
  agentIdentifier: string = "mcp-server"
): Promise<KeyResponse> {
  const url = `${config.apiUrl}/keys/${encodeURIComponent(service)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "X-Agent-Identifier": agentIdentifier,
    },
  });

  if (res.status === 401) {
    throw new Error("Session expired. Run `locker login` to re-authenticate.");
  }

  if (res.status === 404) {
    throw new Error(`No key found for service: ${service}. Store one with: locker set ${service} <key>`);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({} as Record<string, string>)) as Record<string, string>;
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return (await res.json()) as KeyResponse;
}

/**
 * Lists all stored service names (not key values).
 */
export async function listServices(
  config: LockerConfig
): Promise<ServiceListItem[]> {
  const url = `${config.apiUrl}/keys`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {
    throw new Error("Session expired. Run `locker login` to re-authenticate.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({} as Record<string, string>)) as Record<string, string>;
    throw new Error(body.error || `API error: ${res.status}`);
  }

  const data = (await res.json()) as { services: ServiceListItem[] };
  return data.services;
}
