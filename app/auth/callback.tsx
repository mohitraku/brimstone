import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useURL } from "expo-linking";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

export default function AuthCallback() {
  const url = useURL();
  const router = useRouter();

  useEffect(() => {
    if (!url) return;

    // Supabase puts tokens in the URL fragment after the magic link verify:
    // brimstone://auth/callback#access_token=...&refresh_token=...&type=magiclink
    const fragment = url.split("#")[1];
    if (!fragment) {
      router.replace("/(tabs)");
      return;
    }

    const params = new URLSearchParams(fragment);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(() => {
          router.replace("/(tabs)");
        })
        .catch(() => {
          router.replace("/(auth)/login");
        });
    } else {
      router.replace("/(tabs)");
    }
  }, [url, router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator color={colors.flame.orange} size="large" />
      <Text style={{ color: colors.textDim, marginTop: 16 }}>Entering the shrine...</Text>
    </View>
  );
}
