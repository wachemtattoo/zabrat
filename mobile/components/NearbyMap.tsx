import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { barsAPI } from "../services/api";

let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
}

interface NearbyBar {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distance: number;
}

// Web-only map component using Leaflet
function WebMap({ bars, location, isShop }: { bars: NearbyBar[]; location: { lat: number; lng: number }; isShop: (name: string) => boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: false }).setView([location.lat, location.lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "" }).addTo(map);

      // User location (blue)
      L.circleMarker([location.lat, location.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#2196F3", fillOpacity: 1 }).addTo(map).bindPopup("Toi");

      // Bar markers
      bars.forEach((bar) => {
        const color = isShop(bar.name) ? "#4CAF50" : "#F5A623";
        L.circleMarker([bar.latitude, bar.longitude], { radius: 7, color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 })
          .addTo(map)
          .bindPopup(`<b>${bar.name}</b><br>${bar.distance} km`);
      });

      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [bars, location]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="map" size={18} color={COLORS.primary} />
        <Text style={styles.headerText}>A proximite</Text>
        <Text style={styles.headerCount}>{bars.length} lieux</Text>
      </View>
      <View style={styles.mapContainer}>
        <div ref={mapRef as any} style={{ width: "100%", height: "100%", borderRadius: 16 }} />
      </View>
    </View>
  );
}
import { COLORS, SIZES } from "../constants/theme";

const { width } = Dimensions.get("window");

export default function NearbyMap() {
  const [bars, setBars] = useState<NearbyBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 36.8, lng: 10.18 });
  const [selectedBar, setSelectedBar] = useState<NearbyBar | null>(null);

  useEffect(() => {
    loadNearby();
  }, []);

  const loadNearby = async () => {
    try {
      let lat = 36.8;
      let lng = 10.18;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      } catch {}

      setLocation({ lat, lng });
      const { data } = await barsAPI.nearby(lat, lng, 30);
      setBars(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isShop = (name: string) => {
    const lower = name.toLowerCase();
    return lower.includes("magasin") || lower.includes("monoprix") || lower.includes("carrefour") || lower.includes("nicolas");
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <Ionicons name="map-outline" size={20} color={COLORS.textSecondary} />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  // Web: render map using div + Leaflet injected via useEffect
  if (Platform.OS === "web") {
    return <WebMap bars={bars} location={location} isShop={isShop} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="map" size={18} color={COLORS.primary} />
        <Text style={styles.headerText}>A proximite</Text>
        <Text style={styles.headerCount}>{bars.length} lieux</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {bars.map((bar) => (
            <Marker
              key={bar.id}
              coordinate={{ latitude: bar.latitude, longitude: bar.longitude }}
              title={bar.name}
              description={`${bar.distance} km${bar.address ? " · " + bar.address : ""}`}
              pinColor={isShop(bar.name) ? "#4CAF50" : COLORS.primary}
              onPress={() => setSelectedBar(bar)}
            />
          ))}
        </MapView>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>Bars</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>Magasins</Text>
          </View>
        </View>
      </View>

      {/* Selected bar info */}
      {selectedBar && (
        <View style={styles.selectedCard}>
          <View style={[styles.selectedIcon, isShop(selectedBar.name) && { backgroundColor: "#4CAF50" }]}>
            <Ionicons name={isShop(selectedBar.name) ? "cart" : "beer"} size={20} color="#FFF" />
          </View>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>{selectedBar.name}</Text>
            <Text style={styles.selectedAddr}>{selectedBar.address}</Text>
          </View>
          <View style={styles.selectedDist}>
            <Text style={styles.selectedDistText}>{selectedBar.distance} km</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  loadingBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 16, marginBottom: 12,
  },
  loadingText: { fontSize: SIZES.md, color: COLORS.textSecondary },

  header: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10,
  },
  headerText: { fontSize: SIZES.lg, fontWeight: "800", color: COLORS.text, flex: 1 },
  headerCount: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: "700" },

  // Map
  mapContainer: {
    borderRadius: SIZES.radiusLg,
    overflow: "hidden",
    height: 200,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  legend: {
    position: "absolute", bottom: 8, left: 8,
    flexDirection: "row", gap: 12,
    backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 10, fontWeight: "600", color: COLORS.text },

  // Selected bar
  selectedCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: 12, marginTop: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  selectedIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center", alignItems: "center",
  },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: SIZES.md, fontWeight: "700", color: COLORS.text },
  selectedAddr: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  selectedDist: {
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  selectedDistText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },

  // Web fallback
  webList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  webCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: 10, width: "48%",
  },
  pinIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center", alignItems: "center",
  },
  pinIconShop: { backgroundColor: "#4CAF50" },
  webCardInfo: { flex: 1 },
  webCardName: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  webCardDist: { fontSize: 10, color: COLORS.primary, fontWeight: "600" },
});
