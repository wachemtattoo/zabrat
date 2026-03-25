import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { checkInsAPI, storiesAPI, invitationsAPI } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import CheersButton from "../../components/CheersButton";
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
  if (minutes < 60) return `il y a ${minutes}min`;
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
              <View style={[styles.storyAvatar, group.user.id === user?.id && styles.storyAvatarSelf]}>
                <Text style={styles.storyAvatarText}>
                  {group.user.username[0].toUpperCase()}
                </Text>
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
          <View key={inv.id} style={styles.invitationCard}>
            <Ionicons name="megaphone" size={20} color={COLORS.primary} />
            <View style={styles.invitationContent}>
              <Text style={styles.invitationText}>
                <Text style={styles.invitationUser}>{inv.user.username}</Text>
                {" "}est a{" "}
                <Text style={styles.invitationBar}>{inv.bar.name}</Text>
                {inv.message ? ` — "${inv.message}"` : ""}
              </Text>
              <Text style={styles.invitationMeta}>Qui rejoint ?</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: CheckIn; index: number }) => {
    const isOwn = item.user.id === user?.id;

    return (
      <Animated.View style={[styles.card, { opacity: 1 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.user.username[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.username}>
              {item.user.username}{" "}
              <Text style={styles.levelBadge}>Nv.{item.user.level}</Text>
            </Text>
            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
          </View>
          {item.isStory && (
            <View style={styles.storyTag}>
              <Text style={styles.storyTagText}>Story</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.beerName}>
            {getBeerEmoji(item.beer.type)} Boit une {item.beer.name}
          </Text>
          {item.beer.brand && (
            <Text style={styles.beerBrand}>{item.beer.brand} - {item.beer.type}</Text>
          )}
          {item.bar && (
            <View style={styles.barRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.primary} />
              <Text style={styles.barName}>{item.bar.name}</Text>
            </View>
          )}
          {item.note && <Text style={styles.note}>{item.note}</Text>}
        </View>

        <View style={styles.cardFooter}>
          <CheersButton
            checkInId={item.id}
            initialCount={item._count.cheers}
            isOwn={isOwn}
          />
        </View>
      </Animated.View>
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
            {renderStories()}
            {renderInvitations()}
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="beer-outline" size={64} color={COLORS.border} />
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
  list: { padding: SIZES.padding, gap: 12 },

  // Stories
  storiesSection: { marginBottom: 12 },
  storiesScroll: { gap: 16 },
  storyBubble: { alignItems: "center", width: 68 },
  storyAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: COLORS.primary,
  },
  storyAvatarSelf: { borderColor: COLORS.textSecondary },
  storyAvatarText: { fontSize: 20, fontWeight: "700", color: COLORS.primary },
  storyName: { fontSize: SIZES.xs, fontWeight: "600", color: COLORS.text, marginTop: 4 },

  // Invitations
  invitationsSection: { gap: 8, marginBottom: 12 },
  invitationCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.primaryLight, borderRadius: SIZES.radius,
    padding: 12, borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  invitationContent: { flex: 1 },
  invitationText: { fontSize: SIZES.md, color: COLORS.text },
  invitationUser: { fontWeight: "700" },
  invitationBar: { fontWeight: "700", color: COLORS.primary },
  invitationMeta: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: "700", marginTop: 4 },

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
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  cardHeaderText: { flex: 1 },
  username: { fontSize: SIZES.lg, fontWeight: "700", color: COLORS.text },
  levelBadge: { fontSize: SIZES.xs, fontWeight: "600", color: COLORS.primary },
  time: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  storyTag: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusSm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  storyTagText: { color: "#FFF", fontSize: SIZES.xs, fontWeight: "700" },
  cardBody: { marginTop: 12 },
  beerName: { fontSize: SIZES.xl, fontWeight: "700", color: COLORS.text },
  beerBrand: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  barName: { fontSize: SIZES.md, color: COLORS.primary, fontWeight: "600" },
  note: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 8, fontStyle: "italic" },
  cardFooter: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    flexDirection: "row",
  },
  footerBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  empty: { alignItems: "center", marginTop: 100, gap: 8 },
  emptyText: { fontSize: SIZES.xl, fontWeight: "700", color: COLORS.textSecondary },
  emptySubtext: { fontSize: SIZES.md, color: COLORS.textSecondary },
});
