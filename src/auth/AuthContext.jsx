import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { signOut } from "@firebase/auth";
import { auth } from "../firebaseClient";
import { apiRequest, sessionStore } from "./api.js";

const AuthContext = createContext(null);

async function readResponse(response) {
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    throw new Error(body?.error || "Something went wrong. Please try again.");
  }
  return body;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setAuthError("");
    try {
      const response = await apiRequest("/api/auth/me");
      if (response.status === 401) {
        await sessionStore.clearSessionToken();
        setUser(null);
      } else {
        const data = await readResponse(response);
        setUser(data?.user || null);
      }
    } catch {
      setAuthError("We couldn’t check your sign-in. Check the API connection, then retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (idToken) => {
    try {
      const data = await readResponse(await apiRequest("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          clientType: Platform.OS === "web" ? "web" : "native",
        }),
      }));
      if (Platform.OS !== "web") {
        if (!data.sessionToken) throw new Error("The server did not return a mobile session.");
        await sessionStore.setSessionToken(data.sessionToken);
      }
      setUser(data.user);
    } catch (error) {
      await signOut(auth).catch(() => {});
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const logoutTasks = await Promise.allSettled([
      apiRequest("/api/auth/logout", {
        method: "POST",
      }).then(readResponse),
      signOut(auth),
      sessionStore.clearSessionToken(),
    ]);
    setUser(null);
    const failed = logoutTasks.find((result) => result.status === "rejected");
    if (failed) throw failed.reason;
  }, []);

  const value = useMemo(
    () => ({ user, loading, authError, login, logout, refreshSession }),
    [user, loading, authError, login, logout, refreshSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
