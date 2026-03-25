import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Platform,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { profileAPI } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { COLORS, SIZES } from "../constants/theme";

const CITIES = ["Tunis", "La Marsa", "Sousse", "Sfax", "Hammamet", "Monastir", "Bizerte", "Nabeul", "Djerba", "Tozeur"];

function getAvatarColor(name: string): string {
  const colors = ["#E91E63", "#9C27B0", "#3F51B5", "#009688", "#FF5722", "#795548"];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function EditProfileScreen() {
  const { user, updateUser, logout } = useAuthStore();
  const router = useRouter();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [city, setCity] = useState(user?.city || "");
  const [ghostMode, setGhostMode] = useState(user?.ghostMode || false);
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [showCities, setShowCities] = useState(false);

  const pickImage = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Info", "Le changement de photo n'est pas disponible sur le web");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Autorise l'acces a ta galerie");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setAvatar(base64Uri);
    }
  };

  const save = async () => {
    if (username.length < 3) {
      Alert.alert("Erreur", "Username doit faire au moins 3 caracteres");
      return;
    }
    setSaving(true);
    try {
      const { data } = await profileAPI.update({
        username: username !== user?.username ? username : undefined,
        email: email !== user?.email ? email : undefined,
        bio: bio || null,
        city: city || null,
        avatar,
        ghostMode,
      });
      updateUser(data);
      Alert.alert("Profil mis a jour !");
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erreur lors de la sauvegarde";
      Alert.alert("Erreur", typeof msg === "string" ? msg : "Verifiez vos informations");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irreversible. Toutes tes donnees seront supprimees.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await profileAPI.deleteAccount();
              logout();
            } catch {
              Alert.alert("Erreur", "Impossible de supprimer le compte");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <TouchableOpacity onPress={save} disabled={saving}>
          <Text style={[styles.saveBtn, saving && { opacity: 0.5 }]}>
            {saving ? "..." : "Sauver"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarSection} onPress={pickImage}>
          {avatar ? (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{username[0]?.toUpperCase()}</Text>
            </View>
          ) : (
            <View style={[styles.avatarLarge, { backgroundColor: getAvatarColor(username || "A") }]}>
              <Text style={styles.avatarLargeText}>{username[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={14} color="#FFF" />
          </View>
          <Text style={styles.avatarHint}>Changer la photo</Text>
        </TouchableOpacity>

        {/* Username */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Username</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Bio</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={[styles.input, { minHeight: 50 }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Amateur de Celtia depuis 2020..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={150}
            />
          </View>
          <Text style={styles.charCount}>{bio.length}/150</Text>
        </View>

        {/* City */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ville</Text>
          <TouchableOpacity style={styles.inputGroup} onPress={() => setShowCities(!showCities)}>
            <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
            <Text style={[styles.input, { paddingVertical: 14, color: city ? COLORS.text : COLORS.textSecondary }]}>
              {city || "Selectionner ta ville"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {showCities && (
            <View style={styles.cityList}>
              {CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cityItem, city === c && styles.cityItemActive]}
                  onPress={() => { setCity(c); setShowCities(false); }}
                >
                  <Text style={[styles.cityItemText, city === c && styles.cityItemTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Ghost Mode */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Ionicons name="eye-off-outline" size={20} color={COLORS.textSecondary} />
            <View>
              <Text style={styles.toggleLabel}>Mode fantome</Text>
              <Text style={styles.toggleDesc}>Cache ton activite a tes amis</Text>
            </View>
          </View>
          <Switch
            value={ghostMode}
            onValueChange={setGhostMode}
            trackColor={{ true: COLORS.primary, false: COLORS.border }}
            thumbColor="#FFF"
          />
        </View>

        {/* Danger zone */}
        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={styles.deleteBtnText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SIZES.padding, paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.xl, fontWeight: "800", color: COLORS.text },
  saveBtn: { fontSize: SIZES.lg, fontWeight: "700", color: COLORS.primary },
  content: { padding: SIZES.padding, paddingBottom: 40 },

  // Avatar
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarLarge: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primary,
    justifyContent: "center", alignItems: "center",
  },
  avatarLargeText: { fontSize: 38, fontWeight: "900", color: "#FFF" },
  avatarEditBadge: {
    position: "absolute", bottom: 24, right: "35%",
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: COLORS.background,
  },
  avatarHint: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: "600", marginTop: 8 },

  // Fields
  field: { marginBottom: 18 },
  fieldLabel: { fontSize: SIZES.sm, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 },
  inputGroup: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    paddingHorizontal: 14, gap: 10,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: SIZES.md, color: COLORS.text },
  charCount: { fontSize: 11, color: COLORS.textSecondary, textAlign: "right", marginTop: 4 },

  // City picker
  cityList: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8,
  },
  cityItem: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  cityItemActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  cityItemText: { fontSize: SIZES.sm, fontWeight: "600", color: COLORS.text },
  cityItemTextActive: { color: "#FFF" },

  // Toggle
  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: 16, marginBottom: 18,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  toggleLabel: { fontSize: SIZES.md, fontWeight: "700", color: COLORS.text },
  toggleDesc: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },

  // Danger
  dangerZone: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: COLORS.border },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    padding: 16, borderRadius: SIZES.radius,
    borderWidth: 1.5, borderColor: COLORS.error,
  },
  deleteBtnText: { fontSize: SIZES.md, fontWeight: "700", color: COLORS.error },
});
