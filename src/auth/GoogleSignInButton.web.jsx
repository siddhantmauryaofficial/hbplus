import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { signInWithPopup } from "@firebase/auth";
import { auth, googleProvider } from "../firebaseClient";

const googleMark = "G";

export default function GoogleSignInButton({ onToken, onError }) {
  const [loading, setLoading] = useState(false);

  async function handlePress() {
    setLoading(true);
    onError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await onToken(await result.user.getIdToken());
    } catch (error) {
      onError(error.code === "auth/unauthorized-domain"
        ? "This website is not authorized in Firebase Authentication settings."
        : error.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
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
      {loading ? <ActivityIndicator color="#286346" /> : <View style={styles.googleMark}><Text style={styles.googleText}>{googleMark}</Text></View>}
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
