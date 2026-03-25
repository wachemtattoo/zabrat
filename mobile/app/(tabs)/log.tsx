import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { beersAPI, checkInsAPI, barsAPI } from "../../services/api";
import { COLORS, SIZES } from "../../constants/theme";

interface Beer {
  id: string;
  name: string;
  brand: string | null;
  type: string;
}

interface Bar {
  id: string;
  name: string;
  address: string | null;
}

function getBeerIcon(type: string): string {
  const map: Record<string, string> = {
    IPA: "🍺", Lager: "🍻", Stout: "🍫", Pils: "🥂", Wheat: "🌾", Abbey: "⛪",
  };
  return map[type] || "🍺";
}

export default function LogScreen() {
  const [recentBeers, setRecentBeers] = useState<Beer[]>([]);
  const [allBeers, setAllBeers] = useState<Beer[]>([]);
  const [bars, setBars] = useState<Bar[]>([]);
  const [search, setSearch] = useState("");
  const [logging, setLogging] = useState<string | null>(null);

  // Log options
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [note, setNote] = useState("");
  const [isStory, setIsStory] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [barSearch, setBarSearch] = useState("");
  const [showBarPicker, setShowBarPicker] = useState(false);
  const [newBarName, setNewBarName] = useState("");

  useEffect(() => {
    loadBeers();
    loadBars();
  }, []);

  const loadBeers = async () => {
    try {
      const [recentRes, allRes] = await Promise.all([
        beersAPI.recent(),
        beersAPI.list(),
      ]);
      setRecentBeers(recentRes.data);
      setAllBeers(allRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBars = async () => {
    try {
      const { data } = await barsAPI.list();
      setBars(data);
    } catch (err) {
      console.error(err);
    }
  };

  const quickLog = async (beer: Beer) => {
    setLogging(beer.id);
    try {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await checkInsAPI.create({ beerId: beer.id });
      Alert.alert("Cheers ! 🍻", `${beer.name} loguee !`);
      loadBeers();
    } catch {
      Alert.alert("Erreur", "Impossible de loguer");
    } finally {
      setLogging(null);
    }
  };

  const openOptions = (beer: Beer) => {
    setSelectedBeer(beer);
    setShowOptions(true);
    setNote("");
    setSelectedBar(null);
    setIsStory(false);
  };

  const submitLog = async () => {
    if (!selectedBeer) return;
    setLogging(selectedBeer.id);
    try {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await checkInsAPI.create({
        beerId: selectedBeer.id,
        barId: selectedBar?.id,
        note: note || undefined,
        isStory,
      });
      Alert.alert("Cheers ! 🍻", `${selectedBeer.name} loguee !${isStory ? " (Story)" : ""}`);
      setShowOptions(false);
      loadBeers();
    } catch {
      Alert.alert("Erreur", "Impossible de loguer");
    } finally {
      setLogging(null);
    }
  };

  const createBar = async () => {
    if (!newBarName.trim()) return;
    try {
      const { data } = await barsAPI.create({ name: newBarName.trim() });
      setSelectedBar(data);
      setShowBarPicker(false);
      setNewBarName("");
      loadBars();
    } catch {
      Alert.alert("Erreur", "Impossible de creer le bar");
    }
  };

  const filteredBeers = search
    ? allBeers.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.type.toLowerCase().includes(search.toLowerCase()) ||
          (b.brand && b.brand.toLowerCase().includes(search.toLowerCase()))
      )
    : allBeers;

  const filteredBars = barSearch
    ? bars.filter((b) => b.name.toLowerCase().includes(barSearch.toLowerCase()))
    : bars;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajouter une biere</Text>

      {/* Quick picks */}
      {recentBeers.length > 0 && !search && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recentes (tap = log rapide)</Text>
          <View style={styles.quickPicks}>
            {recentBeers.map((beer) => (
              <TouchableOpacity
                key={beer.id}
                style={styles.quickPick}
                onPress={() => quickLog(beer)}
                onLongPress={() => openOptions(beer)}
                disabled={logging === beer.id}
              >
                <Text style={styles.quickPickEmoji}>{getBeerIcon(beer.type)}</Text>
                <Text style={styles.quickPickName} numberOfLines={1}>{beer.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>Appui long = options (bar, note, story)</Text>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une biere..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Beer list */}
      <FlatList
        data={filteredBeers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.beerRow}
            onPress={() => openOptions(item)}
            disabled={logging === item.id}
          >
            <Text style={styles.beerEmoji}>{getBeerIcon(item.type)}</Text>
            <View style={styles.beerInfo}>
              <Text style={styles.beerName}>{item.name}</Text>
              <Text style={styles.beerMeta}>
                {item.brand ? `${item.brand} - ` : ""}{item.type}
              </Text>
            </View>
            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      {/* Options Modal */}
      <Modal visible={showOptions} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {getBeerIcon(selectedBeer?.type || "")} {selectedBeer?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowOptions(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Bar selection */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setShowBarPicker(true)}
            >
              <Ionicons name="location-outline" size={22} color={COLORS.primary} />
              <Text style={styles.optionText}>
                {selectedBar ? selectedBar.name : "Ajouter un lieu (optionnel)"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {/* Note */}
            <TextInput
              style={styles.noteInput}
              placeholder="Notes (optionnel)"
              placeholderTextColor={COLORS.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
            />

            {/* Story toggle */}
            <View style={styles.storyRow}>
              <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
              <Text style={styles.optionText}>Publier en Story (24h)</Text>
              <Switch
                value={isStory}
                onValueChange={setIsStory}
                trackColor={{ true: COLORS.primary, false: COLORS.border }}
                thumbColor="#FFF"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, logging && styles.submitBtnDisabled]}
              onPress={submitLog}
              disabled={!!logging}
            >
              <Text style={styles.submitBtnText}>
                {logging ? "..." : "Je bois ca ! 🍻"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bar Picker Modal */}
      <Modal visible={showBarPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un bar</Text>
              <TouchableOpacity onPress={() => setShowBarPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un bar..."
                placeholderTextColor={COLORS.textSecondary}
                value={barSearch}
                onChangeText={setBarSearch}
              />
            </View>

            <FlatList
              data={filteredBars}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 250 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.barPickRow}
                  onPress={() => {
                    setSelectedBar(item);
                    setShowBarPicker(false);
                    setBarSearch("");
                  }}
                >
                  <Ionicons name="location" size={18} color={COLORS.primary} />
                  <Text style={styles.barPickName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyBarText}>Aucun bar trouve</Text>
              }
            />

            {/* Create new bar */}
            <View style={styles.newBarSection}>
              <Text style={styles.newBarLabel}>Nouveau bar :</Text>
              <View style={styles.newBarRow}>
                <TextInput
                  style={styles.newBarInput}
                  placeholder="Nom du bar"
                  placeholderTextColor={COLORS.textSecondary}
                  value={newBarName}
                  onChangeText={setNewBarName}
                />
                <TouchableOpacity style={styles.newBarBtn} onPress={createBar}>
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: {
    fontSize: SIZES.xxl, fontWeight: "900", color: COLORS.text,
    padding: SIZES.padding, paddingBottom: 0,
  },
  section: { padding: SIZES.padding, paddingBottom: 0 },
  sectionTitle: {
    fontSize: SIZES.md, fontWeight: "700", color: COLORS.textSecondary,
    marginBottom: 12, textTransform: "uppercase", letterSpacing: 1,
  },
  quickPicks: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  quickPick: {
    backgroundColor: COLORS.primaryLight, borderRadius: SIZES.radius,
    paddingHorizontal: 16, paddingVertical: 12, alignItems: "center",
    minWidth: 80, borderWidth: 2, borderColor: COLORS.primary,
  },
  quickPickEmoji: { fontSize: 28 },
  quickPickName: { fontSize: SIZES.sm, fontWeight: "700", color: COLORS.secondary, marginTop: 4 },
  hint: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 8, fontStyle: "italic" },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface,
    margin: SIZES.padding, borderRadius: SIZES.radius, paddingHorizontal: 12,
    borderWidth: 1, borderColor: COLORS.border, gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: SIZES.lg, color: COLORS.text },
  list: { paddingHorizontal: SIZES.padding, gap: 8, paddingBottom: 20 },
  beerRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, padding: 14, gap: 12,
  },
  beerEmoji: { fontSize: 32 },
  beerInfo: { flex: 1 },
  beerName: { fontSize: SIZES.lg, fontWeight: "700", color: COLORS.text },
  beerMeta: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: SIZES.padding * 1.5,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 20,
  },
  modalTitle: { fontSize: SIZES.xl, fontWeight: "900", color: COLORS.text },
  optionRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  optionText: { flex: 1, fontSize: SIZES.lg, color: COLORS.text },
  noteInput: {
    backgroundColor: COLORS.background, borderRadius: SIZES.radius,
    padding: 14, fontSize: SIZES.md, color: COLORS.text,
    marginVertical: 12, minHeight: 60, textAlignVertical: "top",
  },
  storyRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    padding: 16, alignItems: "center", marginTop: 12,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#FFF", fontSize: SIZES.lg, fontWeight: "900" },

  // Bar picker
  barPickRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  barPickName: { fontSize: SIZES.lg, color: COLORS.text },
  emptyBarText: { fontSize: SIZES.md, color: COLORS.textSecondary, textAlign: "center", paddingVertical: 20 },
  newBarSection: { marginTop: 16 },
  newBarLabel: { fontSize: SIZES.sm, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 8 },
  newBarRow: { flexDirection: "row", gap: 8 },
  newBarInput: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: SIZES.radiusSm,
    padding: 12, fontSize: SIZES.md, color: COLORS.text,
  },
  newBarBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusSm,
    width: 44, justifyContent: "center", alignItems: "center",
  },
});
