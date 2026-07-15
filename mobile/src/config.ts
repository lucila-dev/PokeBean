import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * API base URL for the PokeBean backend.
 * - Production default: https://pokebean.uk
 * - Local dev: set EXPO_PUBLIC_API_URL, or on a physical phone use your Mac's LAN IP
 *   e.g. EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
 * - Android emulator can use http://10.0.2.2:3000 for the host machine.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromExtra) return fromExtra.replace(/\/$/, "");

  if (__DEV__) {
    if (Platform.OS === "android") return "http://10.0.2.2:3000";
    return "http://localhost:3000";
  }

  return "https://pokebean.uk";
}

export const API_URL = resolveApiUrl();
