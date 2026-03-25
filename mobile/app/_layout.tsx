import { useEffect, useRef } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../stores/authStore";
import { View, Text, Animated, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 8 }),
    ]).start();
  }, []);

  return (
    <View style={splashStyles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Text style={splashStyles.emoji}>🍺</Text>
        <Text style={splashStyles.title}>Zabrat</Text>
        <Text style={splashStyles.subtitle}>Track. Share. Cheers.</Text>
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  emoji: { fontSize: 64, textAlign: "center", marginBottom: 12 },
  title: { fontSize: 42, fontWeight: "900", color: "#FFF", textAlign: "center" },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 8, letterSpacing: 2 },
});

export default function RootLayout() {
  const { user, isLoading, loadToken } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === "(auth)";

    if (!user && !inAuth) {
      router.replace("/(auth)/login");
    } else if (user && inAuth) {
      router.replace("/(tabs)/feed");
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Slot />
    </>
  );
}
