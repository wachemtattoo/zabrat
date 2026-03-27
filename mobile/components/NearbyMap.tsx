import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { barsAPI } from "../services/api";
import { COLORS, SIZES } from "../constants/theme";

interface NearbyBar {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distance: number;
}

export default function NearbyMap() {
  const [bars, setBars] = useState<NearbyBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadNearby();
  }, []);

  const loadNearby = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // Default to Tunis center if no permission
        const { data } = await barsAPI.nearby(36.8, 10.18, 50);
        setBars(data);
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      const { data } = await barsAPI.nearby(loc.coords.latitude, loc.coords.longitude, 20);
      setBars(data);
    } catch (err) {
      console.error(err);
      // Fallback to Tunis
      try {
        const { data } = await barsAPI.nearby(36.8, 10.18, 50);
        setBars(data);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="location" size={18} color={COLORS.primary} />
          <Text style={styles.headerText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (bars.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="location" size={18} color={COLORS.primary} />
          <Text style={styles.headerText}>Aucun bar a proximite</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="map" size={18} color={COLORS.primary} />
        <Text style={styles.headerText}>A proximite</Text>
        <Text style={styles.headerCount}>{bars.length} lieux</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {bars.slice(0, 10).map((bar) => (
          <TouchableOpacity key={bar.id} style={styles.barCard} activeOpacity={0.8}>
            <View style={styles.barIcon}>
              <Ionicons
                name={bar.name.toLowerCase().includes("magasin") || bar.name.toLowerCase().includes("monoprix") || bar.name.toLowerCase().includes("carrefour") || bar.name.toLowerCase().includes("nicolas")
                  ? "cart"
                  : "beer"}
                size={20}
                color="#FFF"
              />
            </View>
            <View style={styles.barInfo}>
              <Text style={styles.barName} numberOfLines={1}>{bar.name}</Text>
              <Text style={styles.barAddress} numberOfLines={1}>{bar.address}</Text>
              <View style={styles.distanceRow}>
                <Ionicons name="navigate-outline" size={12} color={COLORS.primary} />
                <Text style={styles.distanceText}>{bar.distance} km</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  headerText: {
    fontSize: SIZES.lg,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
  },
  headerCount: {
    fontSize: SIZES.sm,
    color: COLORS.primary,
    fontWeight: "700",
  },
  scroll: {
    gap: 10,
    paddingRight: 16,
  },
  barCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 12,
    gap: 10,
    width: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  barIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  barInfo: {
    flex: 1,
  },
  barName: {
    fontSize: SIZES.md,
    fontWeight: "700",
    color: COLORS.text,
  },
  barAddress: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
});
