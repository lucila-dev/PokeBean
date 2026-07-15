import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useAuth } from "../../src/auth";
import {
  apiFetch,
  cardImageUrl,
  displayLabel,
  type CatalogCard,
} from "../../src/api";
import { colors } from "../../src/theme";

type CatalogResponse = {
  cards: CatalogCard[];
  totalCount?: number;
  hasMore?: boolean;
};

export default function BrowseScreen() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [cards, setCards] = useState<CatalogCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 500);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "24" });
      if (debounced) params.set("q", debounced);
      else params.set("suggested", "true");

      const data = await apiFetch<CatalogResponse>(
        `/api/catalog?${params.toString()}`,
        { token }
      );
      setCards(data.cards ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load catalog");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [token, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const addCard = async (card: CatalogCard) => {
    if (!token) return;
    setAddingId(card.id);
    setMessage(null);
    setError(null);
    try {
      await apiFetch("/api/cards", {
        method: "POST",
        token,
        body: {
          catalogId: card.id,
          name: card.name,
          displayName: card.displayName,
          description: card.description,
          year: card.year,
          setName: card.setName,
          rarity: card.rarity,
          cardNumber: card.cardNumber,
          imageUrl:
            card.imageUrlExternal ?? card.imageUrl ?? card.imageUrlLarge,
        },
      });
      setMessage(`Added ${displayLabel(card)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add card");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search English cards…"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          style={styles.search}
        />
      </View>

      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && cards.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.count}>
              {debounced
                ? `${cards.length} result${cards.length === 1 ? "" : "s"}`
                : `${cards.length} suggested`}
            </Text>
          }
          renderItem={({ item }) => {
            const src = cardImageUrl(
              item.imageUrlExternal ?? item.imageUrl ?? item.imageUrlLarge
            );
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
                <Pressable
                  onPress={() => addCard(item)}
                  disabled={addingId === item.id}
                  style={({ pressed }) => [
                    styles.addBtn,
                    pressed && { opacity: 0.85 },
                    addingId === item.id && { opacity: 0.5 },
                  ]}
                >
                  <Text style={styles.addText}>
                    {addingId === item.id ? "Adding…" : "Add"}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { padding: 12 },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: { gap: 10 },
  count: {
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
    fontSize: 14,
  },
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
  addBtn: {
    margin: 8,
    backgroundColor: colors.yellow,
    borderRadius: 8,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { fontWeight: "800", color: colors.text, fontSize: 13 },
  ok: { color: "#15803d", paddingHorizontal: 16, marginBottom: 6 },
  error: { color: colors.danger, paddingHorizontal: 16, marginBottom: 6 },
});
