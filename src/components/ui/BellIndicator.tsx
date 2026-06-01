import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useUIStore } from "@/store/ui-store";
import { colors, fontSize } from "@/constants/theme";

export function BellIndicator() {
  const bellLastTolled = useUIStore((s) => s.bellLastTolled);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (bellLastTolled) {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 4000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bellLastTolled]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.bell}>{"🔔"}</Text>
      <Text style={styles.text}>A bell tolls in the distance</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 100,
  },
  bell: {
    fontSize: 16,
    marginBottom: 2,
  },
  text: {
    color: colors.bellActive,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    fontStyle: "italic",
  },
});
