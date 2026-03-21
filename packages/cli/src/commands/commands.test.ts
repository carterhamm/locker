import { describe, it, expect, vi, beforeEach } from "vitest";
import { logoutCommand } from "./logout";
import { whoamiCommand } from "./whoami";

// Mock the config module
vi.mock("../auth/config", () => {
  let mockConfig: any = null;

  return {
    readConfig: vi.fn(() => mockConfig),
    writeConfig: vi.fn(),
    clearConfig: vi.fn(),
    requireAuth: vi.fn(() => {
      if (!mockConfig) {
        // Simulate process.exit by throwing
        throw new Error("NOT_LOGGED_IN");
      }
      return mockConfig;
    }),
    __setMockConfig: (config: any) => {
      mockConfig = config;
    },
  };
});

// Get the mock helpers
import * as configModule from "../auth/config";

const setMockConfig = (configModule as any).__setMockConfig;
const clearConfigMock = configModule.clearConfig as ReturnType<typeof vi.fn>;

describe("logout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("clears config and confirms logout", () => {
    setMockConfig({
      token: "jwt-123",
      email: "test@example.com",
      apiUrl: "http://localhost:3001",
    });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logoutCommand();

    expect(clearConfigMock).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("test@example.com")
    );
  });

  it("handles already logged out", () => {
    setMockConfig(null);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logoutCommand();

    expect(clearConfigMock).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("Already logged out.");
  });
});

describe("whoami", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("prints the logged-in email", () => {
    setMockConfig({
      token: "jwt-123",
      email: "user@locker.dev",
      apiUrl: "http://localhost:3001",
    });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    whoamiCommand();

    expect(consoleSpy).toHaveBeenCalledWith("user@locker.dev");
  });

  it("throws when not logged in", () => {
    setMockConfig(null);

    expect(() => whoamiCommand()).toThrow("NOT_LOGGED_IN");
  });
});
