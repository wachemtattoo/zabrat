import { useState, useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { cheersAPI } from "../services/api";
import { COLORS, SIZES } from "../constants/theme";

interface Props {
  checkInId: string;
  initialCount: number;
  isOwn: boolean;
}

export default function CheersButton({ checkInId, initialCount, isOwn }: Props) {
  const [cheered, setCheered] = useState(false);
  const [count, setCount] = useState(initialCount);
  const scale = useRef(new Animated.Value(1)).current;
  const beerBounce = useRef(new Animated.Value(0)).current;

  const handleCheers = async () => {
    if (cheered || isOwn) return;

    // Haptic + animation
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Beer icon bounce animation
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();

    // Floating +1
    Animated.sequence([
      Animated.timing(beerBounce, { toValue: -20, duration: 300, useNativeDriver: true }),
      Animated.timing(beerBounce, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    setCheered(true);
    setCount((c) => c + 1);

    try {
      await cheersAPI.send(checkInId);
    } catch {
      setCheered(false);
      setCount((c) => c - 1);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.btn, cheered && styles.btnActive]}
      onPress={handleCheers}
      disabled={cheered || isOwn}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale }, { translateY: beerBounce }] }}>
        <Ionicons
          name={cheered ? "beer" : "beer-outline"}
          size={22}
          color={cheered ? COLORS.primary : COLORS.textSecondary}
        />
      </Animated.View>
      <Text style={[styles.text, cheered && styles.textActive]}>
        Cheers{count > 0 ? ` ${count}` : ""}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusSm,
  },
  btnActive: {
    backgroundColor: COLORS.primaryLight,
  },
  text: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  textActive: {
    color: COLORS.primary,
  },
});
