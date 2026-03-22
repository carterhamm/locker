import { describe, it, expect, vi, beforeEach } from "vitest";
import { getKey, listServices } from "./api";

const mockConfig = {
  token: "jwt-test-token",
  email: "test@example.com",
  apiUrl: "http://localhost:3001",
};

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("fetch", mockFetch);
});

describe("getKey", () => {
  it("sends authenticated request with agent identifier", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ service: "openai", key: "sk-abc123" }),
    });

    const result = await getKey(mockConfig, "openai", "claude-code");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/keys/openai",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-test-token",
          "X-Agent-Identifier": "claude-code",
        }),
      })
    );
    expect(result.key).toBe("sk-abc123");
  });

  it("throws on 401 (expired token)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid token" }),
    });

    await expect(getKey(mockConfig, "openai")).rejects.toThrow("Session expired");
  });

  it("throws on 404 (service not found)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Not found" }),
    });

    await expect(getKey(mockConfig, "unknown")).rejects.toThrow("No key found");
  });

  it("defaults agent identifier to mcp-server", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ service: "stripe", key: "sk-stripe-123" }),
    });

    await getKey(mockConfig, "stripe");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Agent-Identifier": "mcp-server",
        }),
      })
    );
  });
});

describe("listServices", () => {
  it("returns service list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        services: [
          { service: "openai", createdAt: "2026-01-01", lastUsed: null },
          { service: "resend", createdAt: "2026-01-02", lastUsed: "2026-01-03" },
        ],
      }),
    });

    const result = await listServices(mockConfig);
    expect(result).toHaveLength(2);
    expect(result[0].service).toBe("openai");
    expect(result[1].service).toBe("resend");
  });

  it("throws on 401", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    await expect(listServices(mockConfig)).rejects.toThrow("Session expired");
  });
});
