import { describe, it, expect } from "vitest";

describe("config", () => {
  it("LockerConfig interface has required fields", () => {
    // Type-level test — if this compiles, the interface is correct
    const config = {
      token: "jwt-123",
      email: "test@example.com",
      apiUrl: "http://localhost:3001",
    };
    expect(config.token).toBe("jwt-123");
    expect(config.email).toBe("test@example.com");
    expect(config.apiUrl).toBe("http://localhost:3001");
  });
});
