import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GoogleSignInButton from "../auth/GoogleSignInButton";
import { useAuth } from "../auth/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const wide = width >= 760;

  const handleToken = useCallback(async (token) => {
    setError("");
    setLoading(true);
    try {
      await login(token);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }, [login]);

  const handleError = useCallback((message) => {
    setError(message);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.layout, wide && styles.wideLayout]}>
        {wide && (
          <View style={styles.brandPanel}>
            <Text style={styles.brandMark}>HB<Text style={styles.brandPlus}>+</Text></Text>
            <View style={styles.brandCopy}>
              <Text style={styles.brandEyebrow}>A HEALTHIER WAY FORWARD</Text>
              <Text style={styles.brandTitle}>Good things happen when we move together.</Text>
              <Text style={styles.brandDescription}>One secure home for the people building better health at HB+.</Text>
            </View>
            <Text style={styles.brandFoot}>●  Team space · Private by design</Text>
            <View pointerEvents="none" style={styles.decorOne} />
            <View pointerEvents="none" style={styles.decorTwo} />
          </View>
        )}
        <ScrollView contentContainerStyle={[styles.loginPanel, wide && styles.wideLoginPanel]}>
          <View style={[styles.loginCard, !wide && styles.mobileCard]}>
            {!wide && <Text style={styles.mobileMark}>HB<Text style={styles.mobilePlus}>+</Text></Text>}
            <View style={styles.iconBox}><Text style={styles.shield}>✓</Text></View>
            <Text style={styles.eyebrow}>WELCOME TO HB+</Text>
            <Text style={styles.title}>Your work starts here.</Text>
            <Text style={styles.description}>Sign in with your official work account to securely access your team space.</Text>
            <View style={styles.domainNote}>
              <View style={styles.checkCircle}><Text style={styles.checkText}>✓</Text></View>
              <Text style={styles.domainCopy}>For HB+ team members <Text style={styles.domainStrong}>@hbplus.fit</Text></Text>
            </View>
            {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <GoogleSignInButton onToken={handleToken} onError={handleError} />
            {loading && <Text accessibilityRole="alert" style={styles.status}>Verifying your account securely...</Text>}
            <Text style={styles.privacy}>Your account is verified securely with Google.</Text>
          </View>
          <Text style={styles.footer}>© {new Date().getFullYear()} HB+  ·  Secure team access</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fbfcfa" },
  layout: { flex: 1 },
  wideLayout: { flexDirection: "row" },
  brandPanel: {
    flex: 0.92,
    minHeight: "100%",
    paddingHorizontal: "9%",
    paddingVertical: 44,
    backgroundColor: "#214d38",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  brandMark: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: -2 },
  brandPlus: { color: "#b5d89c" },
  brandCopy: { width: "100%", maxWidth: 440, alignSelf: "center" },
  brandEyebrow: { color: "#b7d29e", fontSize: 10, fontWeight: "700", letterSpacing: 1.6, marginBottom: 13 },
  brandTitle: { color: "#f6f7f2", fontSize: 48, fontWeight: "600", lineHeight: 56, letterSpacing: -2 },
  brandDescription: { maxWidth: 350, marginTop: 20, color: "#c6d3ca", fontSize: 15, lineHeight: 25 },
  brandFoot: { color: "#cad6cd", fontSize: 12 },
  decorOne: { position: "absolute", width: 550, height: 550, right: -300, top: "15%", borderRadius: 300, borderWidth: 1, borderColor: "#ffffff15" },
  decorTwo: { position: "absolute", width: 720, height: 720, right: -380, top: "8%", borderRadius: 400, borderWidth: 1, borderColor: "#ffffff12" },
  loginPanel: { flexGrow: 1, minHeight: "100%", alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingVertical: 35, backgroundColor: "#fbfcfa" },
  wideLoginPanel: { flex: 1.08, paddingHorizontal: "7%" },
  loginCard: { width: "100%", maxWidth: 390 },
  mobileCard: { marginTop: 15 },
  mobileMark: { color: "#286346", fontSize: 24, fontWeight: "800", letterSpacing: -2, marginBottom: 42 },
  mobilePlus: { color: "#78a967" },
  iconBox: { width: 48, height: 48, borderRadius: 14, borderColor: "#e6ebe5", borderWidth: 1, backgroundColor: "#f3f7f2", alignItems: "center", justifyContent: "center", marginBottom: 23 },
  shield: { color: "#286346", fontSize: 23, fontWeight: "700" },
  eyebrow: { marginBottom: 8, color: "#77917f", fontSize: 10, fontWeight: "700", letterSpacing: 1.6 },
  title: { color: "#20352c", fontSize: 30, fontWeight: "700", letterSpacing: -1 },
  description: { marginTop: 12, marginBottom: 23, color: "#748078", fontSize: 14, lineHeight: 23 },
  domainNote: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, marginBottom: 20, borderRadius: 8, borderWidth: 1, borderColor: "#e7ede7", backgroundColor: "#f8faf7" },
  checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#5e916b", alignItems: "center", justifyContent: "center" },
  checkText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  domainCopy: { color: "#53655a", fontSize: 12 },
  domainStrong: { color: "#294c38", fontWeight: "700" },
  error: { marginBottom: 14, padding: 12, borderRadius: 7, borderWidth: 1, borderColor: "#f1d3d0", color: "#8c302a", backgroundColor: "#fff8f7", fontSize: 12, lineHeight: 18 },
  status: { marginTop: 12, color: "#748078", fontSize: 12, textAlign: "center" },
  privacy: { marginTop: 23, color: "#929b94", fontSize: 11, textAlign: "center" },
  footer: { marginTop: 38, color: "#97a099", fontSize: 11, textAlign: "center" },
});
