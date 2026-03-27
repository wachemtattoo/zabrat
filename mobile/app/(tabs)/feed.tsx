import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { checkInsAPI, storiesAPI, invitationsAPI } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import CheersButton from "../../components/CheersButton";
import NearbyMap from "../../components/NearbyMap";
import { COLORS, SIZES } from "../../constants/theme";

interface CheckIn {
  id: string;
  note: string | null;
  isStory: boolean;
  createdAt: string;
  user: { id: string; username: string; avatar: string | null; level: number };
  beer: { id: string; name: string; type: string; brand: string | null };
  bar: { id: string; name: string } | null;
  _count: { cheers: number };
}

interface StoryGroup {
  user: { id: string; username: string; avatar: string | null };
  stories: any[];
}

interface Invitation {
  id: string;
  message: string | null;
  expiresAt: string;
  user: { id: string; username: string; avatar: string | null };
  bar: { id: string; name: string; address: string | null };
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "a l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function getBeerEmoji(type: string): string {
  const map: Record<string, string> = {
    IPA: "🍺", Lager: "🍻", Stout: "🍫", Pils: "🥂", Wheat: "🌾", Abbey: "⛪",
  };
  return map[type] || "🍺";
}

function getAvatarColor(name: string): string {
  const colors = ["#E91E63", "#9C27B0", "#3F51B5", "#009688", "#FF5722", "#795548", "#607D8B"];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function FeedScreen() {
  const [feed, setFeed] = useState<CheckIn[]>([]);
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  const loadFeed = useCallback(async () => {
    try {
      const [feedRes, storiesRes, invRes] = await Promise.all([
        checkInsAPI.feed(),
        storiesAPI.list(),
        invitationsAPI.list(),
      ]);
      setFeed(feedRes.data);
      setStories(storiesRes.data);
      setInvitations(invRes.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const renderStories = () => {
    if (stories.length === 0) return null;
    return (
      <View style={styles.storiesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
          {stories.map((group) => (
            <TouchableOpacity
              key={group.user.id}
              style={styles.storyBubble}
              onPress={() => Alert.alert(
                `${group.user.username}`,
                group.stories.map((s: any) => `${getBeerEmoji(s.beer.type)} ${s.beer.name}${s.bar ? ` @ ${s.bar.name}` : ""}`).join("\n")
              )}
            >
              <View style={[styles.storyRing, group.user.id === user?.id && styles.storyRingSelf]}>
                <View style={[styles.storyAvatar, { backgroundColor: getAvatarColor(group.user.username) }]}>
                  <Text style={styles.storyAvatarText}>
                    {group.user.username[0].toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.storyName} numberOfLines={1}>
                {group.user.id === user?.id ? "Toi" : group.user.username}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderInvitations = () => {
    if (invitations.length === 0) return null;
    return (
      <View style={styles.invitationsSection}>
        {invitations.map((inv) => (
          <TouchableOpacity key={inv.id} style={styles.invitationCard} activeOpacity={0.8}>
            <View style={styles.invitationIcon}>
              <Ionicons name="location" size={18} color="#FFF" />
            </View>
            <View style={styles.invitationContent}>
              <Text style={styles.invitationText}>
                <Text style={styles.invitationUser}>{inv.user.username}</Text>
                {" "}est a{" "}
                <Text style={styles.invitationBar}>{inv.bar.name}</Text>
              </Text>
              {inv.message && <Text style={styles.invitationMsg}>"{inv.message}"</Text>}
              <Text style={styles.invitationCta}>Rejoindre &rarr;</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderItem = ({ item }: { item: CheckIn }) => {
    const isOwn = item.user.id === user?.id;

    return (
      <View style={styles.card}>
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.user.username) }]}>
            <Text style={styles.avatarText}>
              {item.user.username[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardHeaderText}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>{item.user.username}</Text>
              {item.user.level > 1 && (
                <View style={styles.levelPill}>
                  <Text style={styles.levelPillText}>Nv.{item.user.level}</Text>
                </View>
              )}
            </View>
            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
          </View>
          {item.isStory && (
            <View style={styles.storyTag}>
              <Ionicons name="camera" size={12} color="#FFF" />
              <Text style={styles.storyTagText}>Story</Text>
            </View>
          )}
        </View>

        {/* Beer info */}
        <View style={styles.cardBody}>
          <View style={styles.beerRow}>
            <Text style={styles.beerEmoji}>{getBeerEmoji(item.beer.type)}</Text>
            <View style={styles.beerInfo}>
              <Text style={styles.beerAction}>Boit une <Text style={styles.beerName}>{item.beer.name}</Text></Text>
              {item.beer.brand && (
                <Text style={styles.beerMeta}>{item.beer.brand} &middot; {item.beer.type}</Text>
              )}
            </View>
          </View>

          {item.bar && (
            <View style={styles.barChip}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.barName}>{item.bar.name}</Text>
            </View>
          )}

          {item.note && (
            <View style={styles.noteBox}>
              <Text style={styles.note}>"{item.note}"</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <CheersButton
            checkInId={item.id}
            initialCount={item._count.cheers}
            isOwn={isOwn}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            <NearbyMap />
            {renderStories()}
            {renderInvitations()}
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="beer-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyText}>Aucune activite</Text>
            <Text style={styles.emptySubtext}>
              Ajoute des amis et log ta premiere biere !
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SIZES.padding, paddingBottom: 20, gap: 12 },

  // Stories
  storiesSection: { marginBottom: 4, marginTop: 4 },
  storiesScroll: { gap: 14, paddingRight: 16 },
  storyBubble: { alignItems: "center", width: 72 },
  storyRing: {
    width: 62, height: 62, borderRadius: 31,
    padding: 3,
    borderWidth: 2.5, borderColor: COLORS.primary,
  },
  storyRingSelf: { borderColor: COLORS.textSecondary },
  storyAvatar: {
    flex: 1, borderRadius: 28,
    justifyContent: "center", alignItems: "center",
  },
  storyAvatarText: { fontSize: 22, fontWeight: "800", color: "#FFF" },
  storyName: { fontSize: 11, fontWeight: "600", color: COLORS.text, marginTop: 4 },

  // Invitations
  invitationsSection: { gap: 8, marginBottom: 8 },
  invitationCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  invitationIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center", alignItems: "center",
  },
  invitationContent: { flex: 1 },
  invitationText: { fontSize: SIZES.md, color: COLORS.text, lineHeight: 20 },
  invitationUser: { fontWeight: "800" },
  invitationBar: { fontWeight: "800", color: COLORS.primary },
  invitationMsg: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontStyle: "italic", marginTop: 2 },
  invitationCta: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: "700", marginTop: 4 },

  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.padding,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 19, fontWeight: "800", color: "#FFF" },
  cardHeaderText: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  username: { fontSize: SIZES.lg, fontWeight: "800", color: COLORS.text },
  levelPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8,
  },
  levelPillText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
  time: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 1 },
  storyTag: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  storyTagText: { color: "#FFF", fontSize: 10, fontWeight: "700" },

  // Body
  cardBody: { marginTop: 14 },
  beerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  beerEmoji: { fontSize: 36 },
  beerInfo: { flex: 1 },
  beerAction: { fontSize: SIZES.lg, color: COLORS.text, lineHeight: 22 },
  beerName: { fontWeight: "900", fontSize: SIZES.xl },
  beerMeta: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  barChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 10,
    backgroundColor: COLORS.primaryLight,
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20,
  },
  barName: { fontSize: SIZES.sm, color: COLORS.primaryDark, fontWeight: "700" },
  noteBox: { marginTop: 10 },
  note: { fontSize: SIZES.md, color: COLORS.textSecondary, fontStyle: "italic", lineHeight: 20 },

  // Footer
  cardFooter: {
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    flexDirection: "row",
  },

  // Empty
  empty: { alignItems: "center", marginTop: 100, gap: 10 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center", alignItems: "center",
    marginBottom: 8,
  },
  emptyText: { fontSize: SIZES.xl, fontWeight: "800", color: COLORS.text },
  emptySubtext: { fontSize: SIZES.md, color: COLORS.textSecondary, textAlign: "center" },
});
