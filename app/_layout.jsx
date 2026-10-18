import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack, useRouter, useSegments } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { AuthProvider, useAuth } from "../src/auth/AuthContext.jsx";

WebBrowser.maybeCompleteAuthSession();

function RouteGuard() {
  const { user, loading, authError, refreshSession } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const onDashboard = segments[0] === "dashboard";

  useEffect(() => {
    if (loading || authError) return;
    if (user && !onDashboard) router.replace("/dashboard");
    if (!user && onDashboard) router.replace("/");
  }, [authError, loading, onDashboard, router, user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#286346" />
      </View>
    );
  }

  if (authError) {
    return (
      <View style={styles.center}>
        <Text accessibilityRole="alert" style={styles.error}>{authError}</Text>
        <Text accessibilityRole="button" onPress={refreshSession} style={styles.retry}>Retry connection</Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RouteGuard />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, minHeight: "100%", alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#f8faf7" },
  error: { maxWidth: 440, color: "#8c302a", fontSize: 14, lineHeight: 22, textAlign: "center" },
  retry: { marginTop: 18, color: "#286346", fontSize: 14, fontWeight: "700" },
});
