import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

function getAvatarColor(name: string): string {
  const colors = ["#E91E63", "#9C27B0", "#3F51B5", "#009688", "#FF5722", "#795548"];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
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

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);
  const xpProgress = ((user?.xp || 0) % 100);
  const xpToNext = 100 - xpProgress;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header — matches mockup */}
      <View style={styles.profileHeader}>
        <View style={styles.headerTop}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Profil</Text>
          <TouchableOpacity onPress={() => router.push("/edit-profile")}>
            <Ionicons name="create-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.avatarLarge, { backgroundColor: getAvatarColor(user?.username || "A") }]}>
          <Text style={styles.avatarLargeText}>
            {user?.username[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>

        {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

        <View style={styles.levelRow}>
          <View style={styles.levelPill}>
            <Ionicons name="star" size={13} color={COLORS.star} />
            <Text style={styles.levelPillText}>Niveau {user?.level}</Text>
          </View>
          {user?.city && (
            <View style={styles.cityPill}>
              <Ionicons name="location" size={12} color={COLORS.primary} />
              <Text style={styles.cityPillText}>{user.city}</Text>
            </View>
          )}
        </View>

        {/* XP progress bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={styles.xpText}>{user?.xp} XP · {xpToNext} pour le prochain niveau</Text>
        </View>
      </View>

      {/* Stats cards — like mockup: 3 boxes side by side */}
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

      {/* Favorite type chip */}
      {stats?.favoriteType && (
        <View style={styles.favSection}>
          <View style={styles.favChip}>
            <Text style={styles.favChipLabel}>Preference :</Text>
            <Text style={styles.favChipValue}>{stats.favoriteType}</Text>
          </View>
          {stats.uniqueTypes > 0 && (
            <View style={styles.favChip}>
              <Ionicons name="flask-outline" size={14} color={COLORS.primary} />
              <Text style={styles.favChipValue}>{stats.uniqueTypes} types</Text>
            </View>
          )}
        </View>
      )}

      {/* Weekly Recap */}
      <View style={styles.section}>
        <WeeklyRecap />
      </View>

      {/* Badges — grid like mockup */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <Text style={styles.sectionCount}>{unlockedBadges.length}/{badges.length}</Text>
        </View>

        {unlockedBadges.length > 0 && (
          <View style={styles.badgeGrid}>
            {unlockedBadges.map((b) => (
              <View key={b.id} style={styles.badge}>
                <View style={styles.badgeIcon}>
                  <Ionicons name={(b.icon as any) || "trophy"} size={26} color={COLORS.primary} />
                </View>
                <Text style={styles.badgeName} numberOfLines={2}>{b.name}</Text>
                <Text style={styles.badgeDesc} numberOfLines={1}>{b.description}</Text>
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
                    <Ionicons name="lock-closed" size={22} color={COLORS.textSecondary} />
                  </View>
                  <Text style={[styles.badgeName, styles.badgeNameLocked]} numberOfLines={2}>
                    {b.name}
                  </Text>
                  <Text style={[styles.badgeDesc, styles.badgeDescLocked]} numberOfLines={1}>
                    {b.description}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
        <Text style={styles.logoutText}>Se deconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  profileHeader: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 24,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  headerTop: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", width: "100%",
    paddingHorizontal: SIZES.padding, marginBottom: 16,
  },
  headerTitle: { fontSize: SIZES.xl, fontWeight: "800", color: COLORS.text },
  avatarLarge: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: "center", alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  avatarLargeText: { fontSize: 36, fontWeight: "900", color: "#FFF" },
  username: { fontSize: SIZES.xxl, fontWeight: "900", color: COLORS.text },
  bio: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 6, textAlign: "center", paddingHorizontal: 24 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  cityPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14,
  },
  cityPillText: { fontSize: SIZES.sm, fontWeight: "600", color: COLORS.primary },
  levelPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 14,
  },
  levelPillText: { fontSize: SIZES.sm, fontWeight: "700", color: COLORS.primary },
  xpSection: { alignItems: "center", marginTop: 14, paddingHorizontal: 40 },
  xpBarBg: {
    width: "100%", height: 8, borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  xpBarFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  xpText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6 },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginHorizontal: SIZES.padding,
    marginTop: 16,
    gap: 8,
  },
  statBox: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, padding: 16,
    alignItems: "center",
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  statNum: { fontSize: 26, fontWeight: "900", color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, fontWeight: "600" },

  // Favorite
  favSection: {
    flexDirection: "row", gap: 8,
    marginHorizontal: SIZES.padding, marginTop: 12,
  },
  favChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  favChipLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  favChipValue: { fontSize: SIZES.sm, fontWeight: "700", color: COLORS.primary },

  // Sections
  section: { padding: SIZES.padding },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 14,
  },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: "800", color: COLORS.text },
  sectionCount: { fontSize: SIZES.sm, fontWeight: "700", color: COLORS.primary },

  // Badges
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: { alignItems: "center", width: 80 },
  badgeLocked: { opacity: 0.45 },
  badgeIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center", alignItems: "center",
    marginBottom: 6,
  },
  badgeIconLocked: { backgroundColor: COLORS.border },
  badgeName: { fontSize: 11, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  badgeNameLocked: { color: COLORS.textSecondary },
  badgeDesc: { fontSize: 9, color: COLORS.textSecondary, textAlign: "center", marginTop: 1 },
  badgeDescLocked: {},
  lockedTitle: {
    fontSize: SIZES.sm, fontWeight: "700", color: COLORS.textSecondary,
    marginTop: 16, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 16, padding: 14,
    marginHorizontal: SIZES.padding,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1, borderColor: COLORS.border,
  },
  logoutText: { fontSize: SIZES.md, color: COLORS.error, fontWeight: "600" },
});
