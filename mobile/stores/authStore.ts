import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  level: number;
  xp: number;
  ghostMode: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const { data } = await authAPI.me();
        set({ token, user: data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await AsyncStorage.removeItem("token");
      set({ token: null, user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    await AsyncStorage.setItem("token", data.token);
    set({ token: data.token, user: data.user });
  },

  register: async (username, email, password) => {
    const { data } = await authAPI.register({ username, email, password });
    await AsyncStorage.setItem("token", data.token);
    set({ token: data.token, user: data.user });
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    set({ token: null, user: null });
  },

  updateUser: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },
}));
