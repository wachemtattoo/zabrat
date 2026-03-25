import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import WeeklyRecap from "../../components/WeeklyRecap";
import { checkInsAPI, badgesAPI } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SIZES } from "../../constants/theme";

interface Stats {
  totalCheckins: number;
  thisWeek: number;
  uniqueBars: number;
  uniqueTypes: number;
  favoriteType: string | null;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statsRes, badgesRes] = await Promise.all([
        checkInsAPI.stats(),
        badgesAPI.list(),
      ]);
      setStats(statsRes.data);
      setBadges(badgesRes.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {user?.username[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <View style={styles.levelRow}>
          <View style={styles.levelPill}>
            <Ionicons name="star" size={14} color={COLORS.star} />
            <Text style={styles.levelPillText}>Nv.{user?.level}</Text>
          </View>
          <Text style={styles.xpText}>{user?.xp} XP</Text>
        </View>
        {/* XP progress bar */}
        <View style={styles.xpBarBg}>
          <View style={[styles.xpBarFill, { width: `${((user?.xp || 0) % 100)}%` }]} />
        </View>
        <Text style={styles.xpNext}>{100 - ((user?.xp || 0) % 100)} XP pour le prochain niveau</Text>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.totalCheckins}</Text>
            <Text style={styles.statLabel}>Bieres</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>Cette sem.</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.uniqueBars}</Text>
            <Text style={styles.statLabel}>Bars</Text>
          </View>
        </View>
      )}

      {stats?.favoriteType && (
        <View style={styles.favType}>
          <Text style={styles.favTypeLabel}>Preference :</Text>
          <Text style={styles.favTypeValue}>{stats.favoriteType}</Text>
        </View>
      )}

      {/* Weekly Recap */}
      <View style={styles.section}>
        <WeeklyRecap />
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Badges ({unlockedBadges.length}/{badges.length})
        </Text>

        {unlockedBadges.length > 0 && (
          <View style={styles.badgeGrid}>
            {unlockedBadges.map((b) => (
              <View key={b.id} style={styles.badge}>
                <View style={styles.badgeIcon}>
                  <Ionicons
                    name={(b.icon as any) || "trophy"}
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.badgeName}>{b.name}</Text>
              </View>
            ))}
          </View>
        )}

        {lockedBadges.length > 0 && (
          <>
            <Text style={styles.lockedTitle}>A debloquer</Text>
            <View style={styles.badgeGrid}>
              {lockedBadges.map((b) => (
                <View key={b.id} style={[styles.badge, styles.badgeLocked]}>
                  <View style={[styles.badgeIcon, styles.badgeIconLocked]}>
                    <Ionicons name="lock-closed" size={20} color={COLORS.textSecondary} />
                  </View>
                  <Text style={[styles.badgeName, styles.badgeNameLocked]}>
                    {b.name}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Se deconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: { alignItems: "center", paddingTop: 24, paddingBottom: 16 },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarLargeText: { fontSize: 32, fontWeight: "900", color: "#FFF" },
  username: { fontSize: SIZES.xxl, fontWeight: "900", color: COLORS.text },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  levelPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  levelPillText: { fontSize: SIZES.sm, fontWeight: "700", color: COLORS.primary },
  xpText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  xpBarBg: {
    width: 200, height: 6, borderRadius: 3,
    backgroundColor: COLORS.border, marginTop: 10,
  },
  xpBarFill: {
    height: 6, borderRadius: 3, backgroundColor: COLORS.primary,
  },
  xpNext: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: SIZES.padding,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNum: { fontSize: SIZES.xxl, fontWeight: "900", color: COLORS.primary },
  statLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  favType: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 6,
  },
  favTypeLabel: { fontSize: SIZES.md, color: COLORS.textSecondary },
  favTypeValue: {
    fontSize: SIZES.md,
    fontWeight: "700",
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
  },
  section: { padding: SIZES.padding },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badge: {
    alignItems: "center",
    width: 80,
  },
  badgeLocked: { opacity: 0.5 },
  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeIconLocked: { backgroundColor: COLORS.border },
  badgeName: {
    fontSize: SIZES.xs,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginTop: 6,
  },
  badgeNameLocked: { color: COLORS.textSecondary },
  lockedTitle: {
    fontSize: SIZES.sm,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    padding: 16,
  },
  logoutText: { fontSize: SIZES.md, color: COLORS.error, fontWeight: "600" },
});
