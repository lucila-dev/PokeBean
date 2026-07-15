import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/auth";
import { API_URL } from "../../src/config";
import { colors } from "../../src/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.name}>{user?.name || "Trainer"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>API</Text>
        <Text style={styles.meta}>{API_URL}</Text>
        <Text style={styles.hint}>
          Same account as pokebean.uk. Camera scan comes in a later update.
        </Text>
      </View>

      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}
      >
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  name: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  email: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 15,
  },
  meta: {
    marginTop: 8,
    color: colors.text,
    fontSize: 13,
  },
  hint: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 16,
  },
});
