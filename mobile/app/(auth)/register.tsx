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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await register(email.trim(), password, name.trim() || undefined);
      router.replace("/(tabs)/collection");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create account");
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
        <Text style={styles.brand}>Join PokeBean</Text>
        <Text style={styles.sub}>Same account as the website</Text>

        <Text style={styles.label}>Name (optional)</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Trainer name"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

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

        <Text style={styles.label}>Password (min 8)</Text>
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
          disabled={busy || !email || password.length < 8}
          style={({ pressed }) => [
            styles.button,
            (busy || !email || password.length < 8) && styles.buttonDisabled,
            pressed && { opacity: 0.9 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </Pressable>

        <Text style={styles.footer}>
          Already have an account?{" "}
          <Link href="/(auth)/login" style={styles.link}>
            Sign in
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
    fontSize: 26,
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
