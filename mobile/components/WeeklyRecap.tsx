import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { recapAPI } from "../services/api";
import { COLORS, SIZES } from "../constants/theme";

interface Recap {
  username: string;
  totalBeers: number;
  bars: string[];
  favoriteBeer: string | null;
  favoriteType: string | null;
  newBadges: { name: string; icon: string }[];
  rankPosition: number;
  totalFriends: number;
}

export default function WeeklyRecap() {
  const [recap, setRecap] = useState<Recap | null>(null);

  useEffect(() => {
    recapAPI.weekly().then(({ data }) => setRecap(data)).catch(console.error);
  }, []);

  if (!recap || recap.totalBeers === 0) return null;

  const handleShare = async () => {
    const lines = [
      `🍻 Mon recap Zabrat de la semaine :`,
      `${recap.totalBeers} biere${recap.totalBeers > 1 ? "s" : ""}`,
      recap.bars.length > 0 ? `${recap.bars.length} bar${recap.bars.length > 1 ? "s" : ""} visite${recap.bars.length > 1 ? "s" : ""}` : null,
      recap.favoriteType ? `Pref: ${recap.favoriteType}` : null,
      recap.newBadges.length > 0 ? `${recap.newBadges.length} badge${recap.newBadges.length > 1 ? "s" : ""} debloque${recap.newBadges.length > 1 ? "s" : ""}` : null,
      recap.rankPosition > 0 ? `#${recap.rankPosition} parmi mes amis` : null,
      `\nTelecharge Zabrat !`,
    ].filter(Boolean);

    await Share.share({ message: lines.join("\n") });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={20} color={COLORS.primary} />
        <Text style={styles.title}>Recap de la semaine</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{recap.totalBeers}</Text>
          <Text style={styles.statLabel}>Bieres</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{recap.bars.length}</Text>
          <Text style={styles.statLabel}>Bars</Text>
        </View>
        {recap.rankPosition > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statNum}>#{recap.rankPosition}</Text>
            <Text style={styles.statLabel}>Classement</Text>
          </View>
        )}
      </View>

      {recap.favoriteType && (
        <Text style={styles.favText}>
          Type prefere : <Text style={styles.favValue}>{recap.favoriteType}</Text>
        </Text>
      )}

      {recap.newBadges.length > 0 && (
        <Text style={styles.badgeText}>
          {recap.newBadges.map((b) => b.name).join(", ")} debloque !
        </Text>
      )}

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Ionicons name="share-social-outline" size={18} color="#FFF" />
        <Text style={styles.shareBtnText}>Partager</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primaryLight, borderRadius: SIZES.radiusLg,
    padding: SIZES.padding, borderWidth: 2, borderColor: COLORS.primary,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  title: { fontSize: SIZES.lg, fontWeight: "900", color: COLORS.primaryDark },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statItem: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: SIZES.radiusSm,
    padding: 12, alignItems: "center",
  },
  statNum: { fontSize: SIZES.xxl, fontWeight: "900", color: COLORS.primary },
  statLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  favText: { fontSize: SIZES.md, color: COLORS.text, marginBottom: 4 },
  favValue: { fontWeight: "700", color: COLORS.primary },
  badgeText: { fontSize: SIZES.md, color: COLORS.primary, fontWeight: "700", marginBottom: 8 },
  shareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusSm,
    padding: 12, marginTop: 8,
  },
  shareBtnText: { color: "#FFF", fontWeight: "700", fontSize: SIZES.md },
});
