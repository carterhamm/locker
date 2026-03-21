import { LockerConfig } from "./config";

const DEFAULT_API_URL = "http://localhost:3001";

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T & { error?: string };
}

/**
 * Makes an authenticated request to the Locker API.
 * Handles common error cases (expired token, network, not found).
 */
export async function apiRequest<T = any>(
  method: string,
  path: string,
  config: LockerConfig,
  body?: Record<string, any>,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  const url = `${config.apiUrl}${path}`;
  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.token}`,
    ...headers,
  };

  try {
    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      console.error("Session expired. Run: locker login");
      process.exit(1);
    }

    return { ok: res.ok, status: res.status, data: data as T & { error?: string } };
  } catch (err: any) {
    if (err.cause?.code === "ECONNREFUSED" || err.message?.includes("fetch failed")) {
      console.error(`Cannot connect to Locker API at ${config.apiUrl}`);
      console.error("Is the server running?");
      process.exit(1);
    }
    throw err;
  }
}

/**
 * Makes an unauthenticated request (for login/register).
 */
export async function authRequest<T = any>(
  method: string,
  path: string,
  apiUrl: string,
  body: Record<string, any>
): Promise<ApiResponse<T>> {
  const url = `${apiUrl}${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: data as T & { error?: string } };
  } catch (err: any) {
    if (err.cause?.code === "ECONNREFUSED" || err.message?.includes("fetch failed")) {
      console.error(`Cannot connect to Locker API at ${apiUrl}`);
      console.error("Is the server running?");
      process.exit(1);
    }
    throw err;
  }
}

export function getDefaultApiUrl(): string {
  return process.env.LOCKER_API_URL || DEFAULT_API_URL;
}
