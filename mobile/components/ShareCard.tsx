import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants/theme";

interface Props {
  type: "checkin" | "badge" | "recap";
  title: string;
  subtitle?: string;
  emoji?: string;
  stats?: { label: string; value: string }[];
}

export default function ShareCard({ type, title, subtitle, emoji, stats }: Props) {
  const handleShare = async () => {
    let message = "";

    if (type === "checkin") {
      message = `${emoji || "🍻"} ${title}${subtitle ? `\n${subtitle}` : ""}\n\n#Zabrat`;
    } else if (type === "badge") {
      message = `🏆 Badge debloque sur Zabrat : ${title}\n${subtitle || ""}\n\n#Zabrat`;
    } else if (type === "recap") {
      message = `📊 Mon recap Zabrat :\n${title}\n${stats?.map((s) => `${s.value} ${s.label}`).join(" | ") || ""}\n\n#Zabrat`;
    }

    if (Platform.OS === "web") {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        alert("Copie dans le presse-papier !");
      }
    } else {
      await Share.share({ message });
    }
  };

  return (
    <View style={styles.card}>
      {/* Card content */}
      <View style={styles.content}>
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {stats && (
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <View key={i} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.branding}>
          <Text style={styles.brandText}>Zabrat</Text>
        </View>
      </View>

      {/* Share button */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Ionicons name="share-social-outline" size={16} color="#FFF" />
        <Text style={styles.shareBtnText}>Partager</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  content: {
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
    backgroundColor: COLORS.primary,
    padding: 20,
    alignItems: "center",
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: SIZES.xl, fontWeight: "900", color: "#FFF", textAlign: "center" },
  subtitle: { fontSize: SIZES.md, color: "rgba(255,255,255,0.8)", marginTop: 4, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: 20, marginTop: 16 },
  stat: { alignItems: "center" },
  statValue: { fontSize: SIZES.xxl, fontWeight: "900", color: "#FFF" },
  statLabel: { fontSize: SIZES.xs, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  branding: { marginTop: 16, opacity: 0.6 },
  brandText: { fontSize: SIZES.sm, fontWeight: "900", color: "#FFF", letterSpacing: 2 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.secondary,
    padding: 14,
  },
  shareBtnText: { color: "#FFF", fontWeight: "700", fontSize: SIZES.md },
});
