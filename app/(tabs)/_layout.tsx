import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontSize } from "@/constants/theme";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        color: focused ? colors.flame.orange : colors.textFaint,
        fontSize: fontSize.md,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.flame.orange,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontFamily: "serif",
          textTransform: "uppercase",
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Flame",
          tabBarIcon: ({ focused }) => (
            <TabIcon label={"🔥"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="commitments"
        options={{
          title: "Oaths",
          tabBarIcon: ({ focused }) => (
            <TabIcon label={"⚔"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "Record",
          tabBarIcon: ({ focused }) => (
            <TabIcon label={"◈"} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
