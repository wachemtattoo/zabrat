export const COLORS = {
  primary: "#F5A623",
  primaryDark: "#E0911A",
  primaryLight: "#FFF3E0",
  secondary: "#5D4037",
  secondaryLight: "#8D6E63",
  background: "#FAFAFA",
  surface: "#FFFFFF",
  text: "#333333",
  textSecondary: "#888888",
  border: "#E0E0E0",
  success: "#4CAF50",
  error: "#F44336",
  star: "#FFD700",
};

export const FONTS = {
  regular: "System",
  bold: "System",
};

export const SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  radius: 12,
  radiusSm: 8,
  radiusLg: 16,
  padding: 16,
};

export const API_URL = __DEV__
  ? "http://192.168.100.101:3000"
  : "https://zabrat-api.onrender.com";
