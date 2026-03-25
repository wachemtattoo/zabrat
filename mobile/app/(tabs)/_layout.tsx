import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, Platform } from "react-native";
import { COLORS } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: { backgroundColor: COLORS.surface, elevation: 0, shadowOpacity: 0 },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Accueil",
          headerTitle: () => (
            <View style={styles.headerLogo}>
              <Text style={styles.headerLogoEmoji}>🍺</Text>
              <Text style={styles.headerLogoText}>Zabrat</Text>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <View style={styles.notifBadge}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.secondary} />
                <View style={styles.notifDot} />
              </View>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Amis",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: "",
          headerShown: false,
          tabBarIcon: () => (
            <View style={styles.logButton}>
              <Ionicons name="beer" size={30} color="#FFF" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: "Statist.",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === "ios" ? 88 : 68,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  headerLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerLogoEmoji: { fontSize: 24 },
  headerLogoText: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  headerRight: {
    marginRight: 16,
  },
  notifBadge: {
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  logButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
});
