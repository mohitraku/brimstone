import "react-native-url-polyfill/auto";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useDecay } from "@/hooks/useDecay";
import { useFlame } from "@/hooks/useFlame";
import { useEstus } from "@/hooks/useEstus";
import { BellIndicator } from "@/components/ui/BellIndicator";
import { colors } from "@/constants/theme";

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { refresh } = useFlame();
  const { processDecay } = useDecay(refresh);
  const { checkRegen } = useEstus(refresh);

  useEffect(() => {
    if (isAuthenticated) {
      checkRegen();
      processDecay();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <BellIndicator />
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen
          name="modals/create-commitment"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
