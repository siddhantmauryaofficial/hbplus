import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "@firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  initializeAuth,
} from "@firebase/auth";
import { firebaseConfig } from "./firebaseConfig.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  if (error.code !== "auth/already-initialized") throw error;
  auth = getAuth(app);
}

export { auth };
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  hd: "hbplus.fit",
  prompt: "select_account",
});
