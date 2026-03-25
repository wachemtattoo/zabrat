import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { rankingsAPI } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SIZES } from "../../constants/theme";

interface RankUser {
  id: string;
  username: string;
  avatar: string | null;
  level: number;
  weeklyCount: number;
}

function getMedal(index: number): string {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `${index + 1}`;
}

export default function RankingScreen() {
  const [ranking, setRanking] = useState<RankUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  const load = useCallback(async () => {
    try {
      const { data } = await rankingsAPI.weekly();
      setRanking(data);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trophy" size={24} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Classement hebdo</Text>
      </View>
      <Text style={styles.headerSub}>Reset chaque lundi</Text>

      <FlatList
        data={ranking}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        renderItem={({ item, index }) => {
          const isMe = item.id === user?.id;
          return (
            <View style={[styles.row, isMe && styles.rowMe]}>
              <Text style={styles.rank}>{getMedal(index)}</Text>
              <View style={[styles.avatar, isMe && styles.avatarMe]}>
                <Text style={styles.avatarText}>
                  {item.username[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, isMe && styles.nameMe]}>
                  {item.username} {isMe ? "(toi)" : ""}
                </Text>
                <Text style={styles.level}>Nv.{item.level}</Text>
              </View>
              <View style={styles.countBox}>
                <Text style={styles.count}>{item.weeklyCount}</Text>
                <Text style={styles.countLabel}>bieres</Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="podium-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>Ajoute des amis pour voir le classement</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding,
  },
  headerTitle: { fontSize: SIZES.xxl, fontWeight: "900", color: COLORS.text },
  headerSub: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    paddingHorizontal: SIZES.padding,
    marginBottom: 16,
  },
  list: { paddingHorizontal: SIZES.padding, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 14,
    gap: 12,
  },
  rowMe: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  rank: { fontSize: 24, width: 36, textAlign: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarMe: { backgroundColor: COLORS.primary },
  avatarText: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  info: { flex: 1 },
  name: { fontSize: SIZES.lg, fontWeight: "700", color: COLORS.text },
  nameMe: { color: COLORS.primaryDark },
  level: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  countBox: { alignItems: "center" },
  count: { fontSize: SIZES.xxl, fontWeight: "900", color: COLORS.primary },
  countLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  empty: { alignItems: "center", marginTop: 80, gap: 8 },
  emptyText: { fontSize: SIZES.md, color: COLORS.textSecondary, textAlign: "center" },
});
