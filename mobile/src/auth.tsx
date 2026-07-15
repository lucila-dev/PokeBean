import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "./api";

const TOKEN_KEY = "pokebean_token";
const USER_KEY = "pokebean_user";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser) as AuthUser);
        }
      } catch {
        // ignore corrupt storage
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<{ token: string; user: AuthUser }>(
        "/api/auth/mobile/login",
        {
          method: "POST",
          body: { email, password },
        }
      );
      await persist(data.token, data.user);
    },
    [persist]
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: { email, password, name },
      });
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
