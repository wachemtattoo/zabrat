import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SIZES } from "../../constants/theme";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    } catch {
      Alert.alert("Erreur", "Email ou username deja pris");
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
        <Text style={styles.logo}>Zabrat</Text>
        <Text style={styles.subtitle}>Rejoins la communaute</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={COLORS.textSecondary}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
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
    padding: SIZES.padding * 2,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 16,
    fontSize: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: SIZES.lg,
    fontWeight: "700",
  },
  link: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: SIZES.md,
    marginTop: 16,
  },
  linkBold: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
