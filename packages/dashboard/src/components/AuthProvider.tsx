"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

/**
 * [H2] Auth state management.
 * - Cookie (httpOnly) handles the actual auth with the API.
 * - We still keep user info in state for rendering, but the TOKEN
 *   is no longer stored in localStorage.
 * - On mount, we call /api/auth/me to check if the cookie is valid.
 * - The `token` field is kept for backward compat with dashboard pages
 *   that pass it in fetch headers (the cookie handles auth anyway).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if we have a valid session via cookie
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken("cookie"); // Placeholder — actual auth is via httpOnly cookie
        }
      } catch {
        // No session or API not reachable
      }

      // Also check localStorage for legacy/demo tokens
      const storedToken = localStorage.getItem("locker-token");
      const storedUser = localStorage.getItem("locker-user");
      if (storedToken && storedUser && !user) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("locker-token");
          localStorage.removeItem("locker-user");
        }
      }

      setIsLoading(false);
    })();
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    // Keep localStorage as fallback for demo mode
    localStorage.setItem("locker-token", newToken);
    localStorage.setItem("locker-user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: token && token !== "cookie"
          ? { Authorization: `Bearer ${token}` }
          : {},
      });
    } catch {
      // Best effort
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("locker-token");
    localStorage.removeItem("locker-user");
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
