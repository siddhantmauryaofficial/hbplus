import * as SecureStore from "expo-secure-store";

const sessionKey = "hbplus_session";

export function getSessionToken() {
  return SecureStore.getItemAsync(sessionKey);
}

export function setSessionToken(token) {
  return SecureStore.setItemAsync(sessionKey, token);
}

export function clearSessionToken() {
  return SecureStore.deleteItemAsync(sessionKey);
}
