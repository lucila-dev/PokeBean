import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/auth";
import { colors } from "../src/theme";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  if (user) return <Redirect href="/(tabs)/collection" />;
  return <Redirect href="/(auth)/login" />;
}
