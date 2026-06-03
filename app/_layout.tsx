// Root layout — stack navigator, decay processing, status bar.
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useDecay } from "../src/useDecay";
import { useFlame } from "../src/useFlame";
import { colors } from "../src/theme";

export default function RootLayout() {
  const { refresh } = useFlame();
  const { processDecay, rekindleIfDead } = useDecay(refresh);

  // Process overnight decay and rekindle on mount
  useEffect(() => {
    async function init() {
      await processDecay();
      await rekindleIfDead();
    }
    init();
  }, [processDecay, rekindleIfDead]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="create-commitment"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
          }}
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
