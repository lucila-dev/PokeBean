import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useAuth } from "../../src/auth";
import {
  apiFetch,
  cardImageUrl,
  displayLabel,
  type Card,
} from "../../src/api";
import { colors } from "../../src/theme";

export default function CollectionScreen() {
  const { token } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await apiFetch<Card[]>("/api/cards", { token });
      setCards(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load cards");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  if (loading && cards.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.count}>
          {cards.length} card{cards.length === 1 ? "" : "s"}
        </Text>
        <Pressable onPress={load}>
          <Text style={styles.refresh}>Refresh</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.blue} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No cards yet. Use Browse on the web or app to add some.
          </Text>
        }
        renderItem={({ item }) => {
          const src = cardImageUrl(item.imageUrl);
          return (
            <View style={styles.card}>
              {src ? (
                <Image source={{ uri: src }} style={styles.image} contentFit="cover" />
              ) : (
                <View style={[styles.image, styles.placeholder]}>
                  <Text style={styles.placeholderText}>?</Text>
                </View>
              )}
              <Text numberOfLines={2} style={styles.title}>
                {displayLabel(item)}
              </Text>
              {item.rarity ? <Text style={styles.meta}>{item.rarity}</Text> : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  count: { fontWeight: "700", color: colors.text, fontSize: 15 },
  refresh: { color: colors.blue, fontWeight: "600" },
  error: { color: colors.danger, paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: { gap: 10 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: "100%",
    aspectRatio: 2.5 / 3.5,
    backgroundColor: "#e5e7eb",
  },
  placeholder: { alignItems: "center", justifyContent: "center" },
  placeholderText: { fontSize: 28, color: colors.muted, fontWeight: "700" },
  title: {
    paddingHorizontal: 8,
    paddingTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    minHeight: 36,
  },
  meta: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    fontSize: 11,
    color: colors.muted,
  },
  empty: {
    textAlign: "center",
    color: colors.muted,
    marginTop: 48,
    paddingHorizontal: 24,
  },
});
