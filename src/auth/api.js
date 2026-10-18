import { Platform } from "react-native";
import * as sessionStore from "./sessionStore";

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  if (Platform.OS === "android") return "http://10.0.2.2:3001";
  return "http://localhost:3001";
}

export async function apiRequest(path, options = {}) {
  const token = Platform.OS === "web" ? null : await sessionStore.getSessionToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
    credentials: Platform.OS === "web" ? "include" : "omit",
  });
}

export { sessionStore };
