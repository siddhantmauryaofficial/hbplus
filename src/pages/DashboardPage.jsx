import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../auth/AuthContext.jsx";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const initials = user?.name
    ? user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "H";

  async function handleLogout() {
    setLoggingOut(true);
    setError("");
    try {
      await logout();
      router.replace("/");
    } catch (logoutError) {
      setError(logoutError.message);
      setLoggingOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.topbar}>
          <Text accessibilityRole="header" style={styles.wordmark}>HB<Text style={styles.plus}>+</Text></Text>
          <View style={styles.accountMenu}>
            <View style={styles.accountCopy}>
              <Text numberOfLines={1} style={styles.accountName}>{user?.name || user?.email}</Text>
              <Text numberOfLines={1} style={styles.accountEmail}>{user?.name ? user?.email : "Team member"}</Text>
            </View>
            {user?.picture
              ? <Image source={{ uri: user.picture }} style={styles.avatar} />
              : <View style={styles.avatarFallback}><Text style={styles.initials}>{initials}</Text></View>}
            <Pressable
              accessibilityRole="button"
              disabled={loggingOut}
              onPress={handleLogout}
              style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed, loggingOut && styles.disabled]}
            >
              {loggingOut
                ? <ActivityIndicator size="small" color="#536158" />
                : <Text style={styles.logoutText}>Sign out</Text>}
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.welcomeLabel}><View style={styles.dot} /><Text style={styles.labelText}>HB+ TEAM SPACE</Text></View>
          <Text accessibilityRole="header" style={styles.heading}>You’re in. <Text style={styles.headingAccent}>Welcome.</Text></Text>
          <Text style={styles.intro}>Good to have you here{user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Your secure team space is ready.</Text>
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

          <View style={styles.cards}>
            <View style={styles.welcomeCard}>
              <View style={styles.cardTop}>
                <View style={styles.shield}><Text style={styles.shieldCheck}>✓</Text></View>
                <View style={styles.verifiedBadge}><View style={styles.smallDot} /><Text style={styles.verifiedText}>Verified</Text></View>
              </View>
              <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
              <Text style={styles.cardHeading}>You’re all set.</Text>
              <Text style={styles.cardCopy}>You’re signed in with an approved HB+ account. This private space is only available to verified team members.</Text>
              <View style={styles.accountDetail}>
                <Text style={styles.detailLabel}>SIGNED IN AS</Text>
                <Text selectable style={styles.detailValue}>{user?.email}</Text>
              </View>
            </View>
            <View style={styles.sideCard}>
              <View style={styles.sparkle}><Text style={styles.sparkleText}>✦</Text></View>
              <Text style={styles.sideEyebrow}>A NOTE FROM HB+</Text>
              <Text style={styles.sideHeading}>Better, together.</Text>
              <Text style={styles.sideCopy}>We’re glad you’re here. Keep this space close as we build healthier futures, one good day at a time.</Text>
              <View style={styles.rule} />
              <Text style={styles.signoff}>The HB+ team</Text>
            </View>
          </View>
          <Text style={styles.securityFoot}>♧  Your sign-in is protected and managed securely.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f8f5" },
  page: { flexGrow: 1 },
  topbar: { minHeight: 76, paddingHorizontal: "7.5%", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e9ede8", backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wordmark: { color: "#173d2c", fontSize: 27, fontWeight: "800", letterSpacing: -2 },
  plus: { color: "#78a967" },
  accountMenu: { flexDirection: "row", alignItems: "center", gap: 11 },
  accountCopy: { alignItems: "flex-end", maxWidth: 210 },
  accountName: { maxWidth: 210, color: "#263a2f", fontSize: 12, fontWeight: "600" },
  accountEmail: { maxWidth: 210, marginTop: 3, color: "#8a948d", fontSize: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "#e6ebe5" },
  avatarFallback: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "#e6ebe5", backgroundColor: "#edf3ec", alignItems: "center", justifyContent: "center" },
  initials: { color: "#286346", fontSize: 11, fontWeight: "700" },
  logoutButton: { minWidth: 68, minHeight: 36, marginLeft: 5, paddingHorizontal: 11, borderWidth: 1, borderColor: "#e5eae5", borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  logoutText: { color: "#536158", fontSize: 11, fontWeight: "600" },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
  content: { width: "85%", maxWidth: 900, alignSelf: "center", paddingTop: 65, paddingBottom: 42 },
  welcomeLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#9ac779" },
  labelText: { color: "#78877c", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  heading: { marginTop: 17, color: "#20352c", fontSize: 48, fontWeight: "700", letterSpacing: -2 },
  headingAccent: { color: "#6e9b6e" },
  intro: { marginTop: 8, color: "#77837a", fontSize: 14, lineHeight: 22 },
  cards: { flexDirection: "row", flexWrap: "wrap", gap: 18, marginTop: 33 },
  welcomeCard: { flexGrow: 1, flexBasis: 340, minHeight: 300, padding: 27, borderWidth: 1, borderColor: "#e8ece7", borderRadius: 11, backgroundColor: "#fff" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 25 },
  shield: { width: 42, height: 42, borderRadius: 11, borderWidth: 1, borderColor: "#e6ebe5", backgroundColor: "#f3f7f2", alignItems: "center", justifyContent: "center" },
  shieldCheck: { color: "#286346", fontSize: 20, fontWeight: "700" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "#e2eddf", borderRadius: 18, backgroundColor: "#f6faf4" },
  smallDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#9ac779" },
  verifiedText: { color: "#59805d", fontSize: 10, fontWeight: "600" },
  eyebrow: { marginBottom: 6, color: "#77917f", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  cardHeading: { color: "#20352c", fontSize: 23, fontWeight: "700", letterSpacing: -0.5 },
  cardCopy: { marginTop: 10, color: "#7b867e", fontSize: 12, lineHeight: 21 },
  accountDetail: { marginTop: 21, paddingTop: 17, borderTopWidth: 1, borderTopColor: "#edf0ec", gap: 7 },
  detailLabel: { color: "#9aa39b", fontSize: 9, fontWeight: "700", letterSpacing: 1.1 },
  detailValue: { color: "#345543", fontSize: 12, fontWeight: "600" },
  sideCard: { flexGrow: 1, flexBasis: 250, minHeight: 300, padding: 25, borderWidth: 1, borderColor: "#dce8d8", borderRadius: 11, backgroundColor: "#edf3eb" },
  sparkle: { width: 37, height: 37, marginBottom: 21, borderWidth: 1, borderColor: "#dce8d8", borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#f6f9f4" },
  sparkleText: { color: "#638761", fontSize: 18 },
  sideEyebrow: { marginBottom: 6, color: "#799078", fontSize: 10, fontWeight: "700", letterSpacing: 1.3 },
  sideHeading: { color: "#20352c", fontSize: 21, fontWeight: "700" },
  sideCopy: { marginTop: 10, color: "#718074", fontSize: 12, lineHeight: 21 },
  rule: { height: 1, marginTop: 21, marginBottom: 12, backgroundColor: "#dce6d9" },
  signoff: { color: "#668068", fontSize: 11, fontWeight: "600" },
  securityFoot: { marginTop: 25, color: "#929c93", textAlign: "center", fontSize: 10 },
  error: { marginTop: 16, color: "#8c302a", fontSize: 13 },
});
