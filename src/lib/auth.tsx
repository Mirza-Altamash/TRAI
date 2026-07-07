import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Employee, Role } from "@/types";

const STORAGE_KEY = "trai.auth.session";

export interface AuthSession {
  user: Employee;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  setSession: (s: AuthSession | null) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Module-level cache so route guards (beforeLoad) can read synchronously.
let cached: AuthSession | null = null;

function readStorage(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function getCurrentSession(): AuthSession | null {
  if (cached) return cached;
  cached = readStorage();
  return cached;
}

export function setCurrentSession(s: AuthSession | null) {
  cached = s;
  if (typeof window === "undefined") return;
  if (s) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else window.sessionStorage.removeItem(STORAGE_KEY);
}

export function dashboardPathFor(role: Role): string {
  switch (role) {
    case "ADMIN": return "/admin/dashboard";
    case "USER": return "/user/dashboard";
    case "L2": return "/l2/assignments";
    case "L3": return "/admin/dashboard";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() => getCurrentSession());

  useEffect(() => {
    cached = session;
    if (session?.user) {
      import("./socketClient").then(({ connectSocket }) => {
        connectSocket(session.user.empId, session.user.role);
      });
    } else {
      import("./socketClient").then(({ disconnectSocket }) => {
        disconnectSocket();
      });
    }
  }, [session]);

  useEffect(() => {
    const handleFocus = async () => {
      const current = getCurrentSession();
      if (!current || !current.accessToken) return;

      try {
        const { apiClient } = await import("./apiClient");
        const res = await apiClient.get<{ user: Employee }>("/auth/me");
        setSessionState((prev) => (prev ? { ...prev, user: res.data.user } : null));
      } catch (err) {
        console.error("Focus revalidation failed, logging out:", err);
        setCurrentSession(null);
        setSessionState(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
      }
    };
  }, []);

  const value: AuthContextValue = {
    session,
    setSession: (s) => {
      setCurrentSession(s);
      setSessionState(s);
    },
    signOut: () => {
      setCurrentSession(null);
      setSessionState(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useCurrentUser(): Employee {
  const { session } = useAuth();
  if (!session) throw new Error("No active session");
  return session.user;
}