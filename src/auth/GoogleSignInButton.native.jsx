import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "@firebase/auth";
import { auth } from "../firebaseClient";

const googleClientIds = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "missing.apps.googleusercontent.com",
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "missing.apps.googleusercontent.com",
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "missing.apps.googleusercontent.com",
};
const hasGoogleClientIds = [
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
].every(Boolean);

export default function GoogleSignInButton({ onToken, onError }) {
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    ...googleClientIds,
    selectAccount: true,
  });

  useEffect(() => {
    if (response?.type !== "success") {
      if (response?.type === "error") onError(response.error?.message || "Google sign-in failed.");
      return;
    }

    let active = true;
    async function completeSignIn() {
      const idToken = response.authentication?.idToken || response.params?.id_token;
      if (!idToken) {
        onError("Google did not return an ID token. Check the OAuth client IDs and redirect URI.");
        setLoading(false);
        return;
      }
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        await onToken(await result.user.getIdToken());
      } catch (error) {
        if (active) onError(error.message || "Google sign-in failed. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    completeSignIn();
    return () => {
      active = false;
    };
  }, [onError, onToken, response]);

  async function handlePress() {
    if (!hasGoogleClientIds) {
      onError("Add the web, iOS, and Android Google OAuth client IDs to your environment configuration.");
      return;
    }
    if (!request) return;
    onError("");
    setLoading(true);
    try {
      const result = await promptAsync();
      if (result.type !== "success") setLoading(false);
    } catch (error) {
      setLoading(false);
      onError(error.message || "Google sign-in could not start.");
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      disabled={loading}
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, loading && styles.disabled]}
    >
      {loading ? <ActivityIndicator color="#286346" /> : <View style={styles.googleMark}><Text style={styles.googleText}>G</Text></View>}
      <Text style={styles.label}>{loading ? "Signing in..." : "Continue with Google"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "#d9dfda",
    borderRadius: 8,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  pressed: { backgroundColor: "#f3f7f2" },
  disabled: { opacity: 0.65 },
  googleMark: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#4285f4", alignItems: "center", justifyContent: "center" },
  googleText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  label: { color: "#303b34", fontSize: 14, fontWeight: "600" },
});
