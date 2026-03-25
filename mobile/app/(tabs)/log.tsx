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
  SafeAreaView,
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

const BEER_TYPES = [
  { type: "IPA", emoji: "🍺", color: "#F5A623" },
  { type: "Lager", emoji: "🍻", color: "#FFC107" },
  { type: "Pils", emoji: "🥂", color: "#FFD54F" },
  { type: "Stout", emoji: "🍫", color: "#5D4037" },
  { type: "Wheat", emoji: "🌾", color: "#FF9800" },
  { type: "Abbey", emoji: "⛪", color: "#8D6E63" },
];

function getBeerIcon(type: string): string {
  return BEER_TYPES.find((t) => t.type === type)?.emoji || "🍺";
}

export default function LogScreen() {
  const [recentBeers, setRecentBeers] = useState<Beer[]>([]);
  const [allBeers, setAllBeers] = useState<Beer[]>([]);
  const [bars, setBars] = useState<Bar[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
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

  const filteredBeers = allBeers.filter((b) => {
    const matchSearch = !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.type.toLowerCase().includes(search.toLowerCase()) ||
      (b.brand && b.brand.toLowerCase().includes(search.toLowerCase()));
    const matchType = !filterType || b.type === filterType;
    return matchSearch && matchType;
  });

  const filteredBars = barSearch
    ? bars.filter((b) => b.name.toLowerCase().includes(barSearch.toLowerCase()))
    : bars;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ajouter une biere</Text>
      </View>

      {/* Beer type filter chips — like mockup */}
      <View style={styles.typeFilters}>
        {BEER_TYPES.map((bt) => (
          <TouchableOpacity
            key={bt.type}
            style={[
              styles.typeChip,
              filterType === bt.type && { backgroundColor: bt.color },
            ]}
            onPress={() => setFilterType(filterType === bt.type ? null : bt.type)}
          >
            <Text style={styles.typeChipEmoji}>{bt.emoji}</Text>
            <Text style={[
              styles.typeChipText,
              filterType === bt.type && { color: "#FFF" },
            ]}>{bt.type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick picks */}
      {recentBeers.length > 0 && !search && !filterType && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENTES</Text>
          <View style={styles.quickPicks}>
            {recentBeers.map((beer) => (
              <TouchableOpacity
                key={beer.id}
                style={styles.quickPick}
                onPress={() => quickLog(beer)}
                onLongPress={() => openOptions(beer)}
                disabled={logging === beer.id}
                activeOpacity={0.7}
              >
                <Text style={styles.quickPickEmoji}>{getBeerIcon(beer.type)}</Text>
                <Text style={styles.quickPickName} numberOfLines={1}>{beer.name}</Text>
                <Text style={styles.quickPickType}>{beer.type}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
            activeOpacity={0.7}
          >
            <View style={styles.beerEmojiBox}>
              <Text style={styles.beerEmoji}>{getBeerIcon(item.type)}</Text>
            </View>
            <View style={styles.beerInfo}>
              <Text style={styles.beerName}>{item.name}</Text>
              <Text style={styles.beerMeta}>
                {item.brand ? `${item.brand} · ` : ""}{item.type}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => quickLog(item)}
              disabled={logging === item.id}
            >
              <Ionicons name="add" size={22} color="#FFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Options Modal */}
      <Modal visible={showOptions} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalBeerInfo}>
                <Text style={styles.modalEmoji}>{getBeerIcon(selectedBeer?.type || "")}</Text>
                <View>
                  <Text style={styles.modalTitle}>{selectedBeer?.name}</Text>
                  <Text style={styles.modalSubtitle}>{selectedBeer?.brand} · {selectedBeer?.type}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowOptions(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Bar selection */}
            <TouchableOpacity style={styles.optionRow} onPress={() => setShowBarPicker(true)}>
              <View style={styles.optionIcon}>
                <Ionicons name="location" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.optionText}>
                {selectedBar ? selectedBar.name : "Ajouter un lieu"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {/* Note */}
            <TextInput
              style={styles.noteInput}
              placeholder="Que penses-tu de cette biere ?"
              placeholderTextColor={COLORS.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
            />

            {/* Story toggle */}
            <View style={styles.storyRow}>
              <View style={styles.optionIcon}>
                <Ionicons name="camera" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.optionText}>Publier en Story (24h)</Text>
              <Switch
                value={isStory}
                onValueChange={setIsStory}
                trackColor={{ true: COLORS.primary, false: COLORS.border }}
                thumbColor="#FFF"
              />
            </View>

            {/* Submit — big orange button like mockup */}
            <TouchableOpacity
              style={[styles.submitBtn, logging && styles.submitBtnDisabled]}
              onPress={submitLog}
              disabled={!!logging}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>
                {logging ? "..." : "Je bois ca !"}
              </Text>
              <Text style={styles.submitBtnEmoji}>🍻</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bar Picker Modal */}
      <Modal visible={showBarPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un lieu</Text>
              <TouchableOpacity onPress={() => setShowBarPicker(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
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
                  onPress={() => { setSelectedBar(item); setShowBarPicker(false); setBarSearch(""); }}
                >
                  <View style={styles.barPickIcon}>
                    <Ionicons name="location" size={16} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.barPickName}>{item.name}</Text>
                    {item.address && <Text style={styles.barPickAddr}>{item.address}</Text>}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyBarText}>Aucun bar trouve</Text>
              }
            />

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.padding, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: SIZES.xxl, fontWeight: "900", color: COLORS.text },

  // Type filters — horizontal chips like mockup
  typeFilters: {
    flexDirection: "row", paddingHorizontal: SIZES.padding,
    gap: 8, marginTop: 12, marginBottom: 4, flexWrap: "wrap",
  },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.surface, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  typeChipEmoji: { fontSize: 18 },
  typeChipText: { fontSize: SIZES.sm, fontWeight: "700", color: COLORS.text },

  // Quick picks
  section: { paddingHorizontal: SIZES.padding, marginTop: 12 },
  sectionTitle: {
    fontSize: 11, fontWeight: "800", color: COLORS.textSecondary,
    marginBottom: 10, letterSpacing: 1.5,
  },
  quickPicks: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  quickPick: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    paddingHorizontal: 14, paddingVertical: 12, alignItems: "center",
    minWidth: 80, borderWidth: 2, borderColor: COLORS.primary,
  },
  quickPickEmoji: { fontSize: 28 },
  quickPickName: { fontSize: 11, fontWeight: "700", color: COLORS.secondary, marginTop: 4 },
  quickPickType: { fontSize: 9, color: COLORS.textSecondary, marginTop: 1 },

  // Search
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface,
    margin: SIZES.padding, marginTop: 12, marginBottom: 8,
    borderRadius: SIZES.radius, paddingHorizontal: 12,
    borderWidth: 1, borderColor: COLORS.border, gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: SIZES.md, color: COLORS.text },

  // Beer list
  list: { paddingHorizontal: SIZES.padding, gap: 6, paddingBottom: 20 },
  beerRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, padding: 12, gap: 12,
  },
  beerEmojiBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center", alignItems: "center",
  },
  beerEmoji: { fontSize: 26 },
  beerInfo: { flex: 1 },
  beerName: { fontSize: SIZES.lg, fontWeight: "700", color: COLORS.text },
  beerMeta: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  quickAddBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center", alignItems: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: SIZES.padding * 1.5,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center", marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 20,
  },
  modalBeerInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  modalEmoji: { fontSize: 36 },
  modalTitle: { fontSize: SIZES.xl, fontWeight: "900", color: COLORS.text },
  modalSubtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: "center", alignItems: "center",
  },
  optionRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  optionIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center", alignItems: "center",
  },
  optionText: { flex: 1, fontSize: SIZES.lg, color: COLORS.text },
  noteInput: {
    backgroundColor: COLORS.background, borderRadius: SIZES.radius,
    padding: 14, fontSize: SIZES.md, color: COLORS.text,
    marginVertical: 14, minHeight: 60, textAlignVertical: "top",
  },
  storyRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg,
    padding: 18, alignItems: "center", marginTop: 16,
    flexDirection: "row", justifyContent: "center", gap: 8,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  submitBtnEmoji: { fontSize: 22 },

  // Bar picker
  barPickRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  barPickIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center", alignItems: "center",
  },
  barPickName: { fontSize: SIZES.lg, fontWeight: "600", color: COLORS.text },
  barPickAddr: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 1 },
  emptyBarText: { fontSize: SIZES.md, color: COLORS.textSecondary, textAlign: "center", paddingVertical: 20 },
  newBarSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
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
