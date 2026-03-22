import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiRequest, authRequest, getDefaultApiUrl } from "../auth/client";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const testConfig = {
  token: "jwt-test-token",
  email: "test@example.com",
  apiUrl: "http://localhost:3001",
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("fetch", mockFetch);
});

describe("apiRequest", () => {
  it("sends authenticated request with Bearer token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ services: [] }),
    });

    const res = await apiRequest("GET", "/keys", testConfig);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/keys",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-test-token",
        }),
      })
    );
    expect(res.ok).toBe(true);
  });

  it("sends custom headers (e.g. X-Agent-Identifier)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ key: "sk-123" }),
    });

    await apiRequest("GET", "/keys/resend", testConfig, undefined, {
      "X-Agent-Identifier": "claude-code",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/keys/resend",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Agent-Identifier": "claude-code",
          Authorization: "Bearer jwt-test-token",
        }),
      })
    );
  });

  it("sends JSON body for POST requests", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ service: "resend", message: "Key stored" }),
    });

    await apiRequest("POST", "/keys", testConfig, {
      service: "resend",
      key: "sk-resend-123",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/keys",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ service: "resend", key: "sk-resend-123" }),
      })
    );
  });

  it("returns error data on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "No key found for service: unknown" }),
    });

    const res = await apiRequest("GET", "/keys/unknown", testConfig);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(404);
    expect(res.data.error).toContain("No key found");
  });
});

describe("authRequest", () => {
  it("sends unauthenticated request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        token: "new-jwt",
        user: { id: "1", email: "test@example.com" },
      }),
    });

    const res = await authRequest("POST", "/auth/login", "http://localhost:3001", {
      email: "test@example.com",
      password: "password123",
    });

    expect(res.ok).toBe(true);
    expect(res.data.token).toBe("new-jwt");

    // Should NOT have Authorization header
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers).not.toHaveProperty("Authorization");
  });
});

describe("getDefaultApiUrl", () => {
  const originalEnv = process.env.LOCKER_API_URL;

  afterEach(() => {
    if (originalEnv) {
      process.env.LOCKER_API_URL = originalEnv;
    } else {
      delete process.env.LOCKER_API_URL;
    }
  });

  it("returns default URL when env var is not set", () => {
    delete process.env.LOCKER_API_URL;
    expect(getDefaultApiUrl()).toBe("https://api-production-449f.up.railway.app");
  });

  it("returns env var when set", () => {
    process.env.LOCKER_API_URL = "https://api.locker.dev";
    expect(getDefaultApiUrl()).toBe("https://api.locker.dev");
  });
});
