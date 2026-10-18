import { getApp, getApps, initializeApp } from "@firebase/app";
import { getAuth, GoogleAuthProvider } from "@firebase/auth";
import { firebaseConfig } from "./firebaseConfig.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  hd: "hbplus.fit",
  prompt: "select_account",
});
