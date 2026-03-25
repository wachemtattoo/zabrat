import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { friendsAPI } from "../../services/api";
import { COLORS, SIZES } from "../../constants/theme";

interface Friend {
  id: string;
  username: string;
  avatar: string | null;
  level: number;
}

interface PendingRequest {
  id: string;
  user: { id: string; username: string; avatar: string | null };
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        friendsAPI.list(),
        friendsAPI.pending(),
      ]);
      setFriends(friendsRes.data);
      setPending(pendingRes.data);
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

  const sendRequest = async () => {
    if (!search.trim()) return;
    try {
      await friendsAPI.request(search.trim());
      Alert.alert("Envoye !", `Demande envoyee a ${search}`);
      setSearch("");
    } catch {
      Alert.alert("Erreur", "Utilisateur non trouve ou demande deja envoyee");
    }
  };

  const acceptRequest = async (id: string) => {
    try {
      await friendsAPI.accept(id);
      load();
    } catch {
      Alert.alert("Erreur", "Impossible d'accepter");
    }
  };

  return (
    <View style={styles.container}>
      {/* Add friend */}
      <View style={styles.addSection}>
        <View style={styles.searchBox}>
          <Ionicons name="person-add-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ajouter par username..."
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            onSubmitEditing={sendRequest}
          />
          <TouchableOpacity onPress={sendRequest}>
            <Ionicons name="send" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending requests */}
      {pending.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demandes en attente</Text>
          {pending.map((req) => (
            <View key={req.id} style={styles.pendingRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {req.user.username[0].toUpperCase()}
                </Text>
              </View>
              <Text style={styles.pendingName}>{req.user.username}</Text>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => acceptRequest(req.id)}
              >
                <Text style={styles.acceptBtnText}>Accepter</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Friends list */}
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        renderItem={({ item }) => (
          <View style={styles.friendRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.username[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{item.username}</Text>
              <Text style={styles.friendLevel}>Niveau {item.level}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>Pas encore d'amis</Text>
            <Text style={styles.emptySubtext}>Ajoute tes potes par username !</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  addSection: { padding: SIZES.padding },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: SIZES.lg, color: COLORS.text },
  section: { paddingHorizontal: SIZES.padding, marginBottom: 8 },
  sectionTitle: {
    fontSize: SIZES.sm,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radius,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  pendingName: { flex: 1, fontSize: SIZES.lg, fontWeight: "700", color: COLORS.text },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  acceptBtnText: { color: "#FFF", fontWeight: "700", fontSize: SIZES.sm },
  list: { paddingHorizontal: SIZES.padding, gap: 8 },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  friendInfo: { flex: 1 },
  friendName: { fontSize: SIZES.lg, fontWeight: "700", color: COLORS.text },
  friendLevel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  empty: { alignItems: "center", marginTop: 80, gap: 8 },
  emptyText: { fontSize: SIZES.xl, fontWeight: "700", color: COLORS.textSecondary },
  emptySubtext: { fontSize: SIZES.md, color: COLORS.textSecondary },
});
