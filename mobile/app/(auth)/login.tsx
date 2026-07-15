import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../src/auth";
import { ApiError } from "../../src/api";
import { colors } from "../../src/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)/collection");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.brand}>PokeBean</Text>
        <Text style={styles.sub}>Sign in to your collection</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={onSubmit}
          disabled={busy || !email || !password}
          style={({ pressed }) => [
            styles.button,
            (busy || !email || !password) && styles.buttonDisabled,
            pressed && { opacity: 0.9 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>

        <Text style={styles.footer}>
          No account?{" "}
          <Link href="/(auth)/register" style={styles.link}>
            Create one
          </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  sub: {
    marginTop: 4,
    marginBottom: 20,
    color: colors.muted,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 18,
    backgroundColor: colors.yellow,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontWeight: "800",
    color: colors.text,
    fontSize: 16,
  },
  error: {
    marginTop: 12,
    color: colors.danger,
    fontSize: 14,
  },
  footer: {
    marginTop: 16,
    textAlign: "center",
    color: colors.muted,
  },
  link: {
    color: colors.blue,
    fontWeight: "700",
  },
});
