import { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SIZES } from "../../constants/theme";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }
    if (username.length < 3) {
      Alert.alert("Erreur", "Username doit faire au moins 3 caracteres");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Erreur", "Mot de passe doit faire au moins 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (msg) {
        Alert.alert("Erreur", typeof msg === "string" ? msg : "Verifiez vos informations");
      } else if (err?.message?.includes("Network")) {
        Alert.alert("Erreur reseau", "Impossible de contacter le serveur. Verifie ta connexion internet.");
      } else {
        Alert.alert("Erreur", "Une erreur est survenue. Reessaye.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Image source={require("../../assets/icon.png")} style={styles.logoImg} />
        <Text style={styles.logo}>Zabrat</Text>
        <Text style={styles.subtitle}>Rejoins la communaute</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={COLORS.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? "Inscription..." : "S'inscrire"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>
            Deja un compte ? <Text style={styles.linkBold}>Connecte-toi</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: SIZES.padding * 1.5,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoImg: { width: 90, height: 90, borderRadius: 18, marginBottom: 12 },
  logo: {
    fontSize: 44,
    fontWeight: "900",
    color: COLORS.secondary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 6,
    letterSpacing: 1,
  },
  form: { gap: 14 },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 10,
  },
  inputIcon: { width: 22 },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: SIZES.lg,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#FFF",
    fontSize: SIZES.lg,
    fontWeight: "800",
  },
  link: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: SIZES.md,
    marginTop: 20,
  },
  linkBold: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
