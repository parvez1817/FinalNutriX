import { useEffect, useState, useCallback } from "react";

export interface AuthUser {
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "email";
}

const STORAGE_KEY = "vizly:auth";
const EVENT = "vizly:auth-change";

function read(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function write(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function signIn(user: AuthUser) {
  write(user);
}

export function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("vizly:token");
  }
  write(null);
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(read());
    setHydrated(true);
    const sync = () => setUser(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const logout = useCallback(() => signOut(), []);

  return { user, hydrated, isAuthenticated: !!user, logout };
}
