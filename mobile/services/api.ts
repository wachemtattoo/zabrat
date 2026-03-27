import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/theme";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// Beers
export const beersAPI = {
  list: (q?: string) => api.get("/beers", { params: { q } }),
  recent: () => api.get("/beers/recent"),
};

// Check-ins
export const checkInsAPI = {
  create: (data: {
    beerId: string;
    barId?: string;
    note?: string;
    isStory?: boolean;
    photoUrl?: string;
  }) => api.post("/checkins", data),
  feed: () => api.get("/checkins/feed"),
  my: () => api.get("/checkins/my"),
  stats: () => api.get("/checkins/stats"),
};

// Friends
export const friendsAPI = {
  list: () => api.get("/friends"),
  pending: () => api.get("/friends/pending"),
  request: (username: string) => api.post("/friends/request", { username }),
  accept: (id: string) => api.post(`/friends/accept/${id}`),
  remove: (id: string) => api.delete(`/friends/${id}`),
};

// Badges
export const badgesAPI = {
  list: () => api.get("/badges"),
};

// Rankings
export const rankingsAPI = {
  weekly: () => api.get("/rankings"),
};

// Cheers
export const cheersAPI = {
  send: (checkInId: string) => api.post("/cheers", { checkInId }),
  count: (checkInId: string) => api.get(`/cheers/count/${checkInId}`),
};

// Bars
export const barsAPI = {
  list: (q?: string) => api.get("/bars", { params: { q } }),
  nearby: (lat: number, lng: number, radius?: number) =>
    api.get("/bars/nearby", { params: { lat, lng, radius: radius || 5 } }),
  create: (data: { name: string; address?: string }) => api.post("/bars", data),
  detail: (id: string) => api.get(`/bars/${id}`),
  review: (id: string, data: { rating: number; priceRating?: number; ambianceRating?: number; comment?: string }) =>
    api.post(`/bars/${id}/review`, data),
};

// Invitations
export const invitationsAPI = {
  create: (data: { barId: string; message?: string }) => api.post("/invitations", data),
  list: () => api.get("/invitations"),
};

// Stories
export const storiesAPI = {
  list: () => api.get("/stories"),
};

// Recap
export const recapAPI = {
  weekly: () => api.get("/recap/weekly"),
};

// Profile
export const profileAPI = {
  update: (data: { username?: string; email?: string; bio?: string | null; city?: string | null; avatar?: string | null; ghostMode?: boolean }) =>
    api.put("/profile", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/profile/password", data),
  deleteAccount: () => api.delete("/profile"),
};

export default api;
