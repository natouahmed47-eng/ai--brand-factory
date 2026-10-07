// ============================================
// AI Brand Factory — Theme (Single Source of Truth)
// ============================================

export const theme = {
  bg: "#0B0B0D",
  card: "#1A1A1F",
  cardHover: "#202026",
  gold: "#D4A574",
  goldHover: "#E5B98A",
  goldSoft: "rgba(212,165,116,0.12)",
  goldFaint: "rgba(212,165,116,0.06)",
  text: "#F5F5F0",
  muted: "#8B8B8B",
  mutedDark: "#5A5A5A",
  line: "rgba(212,165,116,0.12)",
  lineSoft: "rgba(255,255,255,0.05)",
  danger: "#E05252",
  success: "#6BBF7A",
  warning: "#E0B052",
} as const;

export const gradients = {
  gold: "linear-gradient(135deg, #D4A574 0%, #E5B98A 100%)",
  goldToDark: "linear-gradient(180deg, #D4A574 0%, #8B6B47 100%)",
  card: "linear-gradient(180deg, #1F1F24 0%, #131317 100%)",
} as const;

export const shadows = {
  goldGlow: "0 30px 80px -20px rgba(212,165,116,0.2)",
  card: "0 10px 40px -10px rgba(0,0,0,0.5)",
} as const;

export const radii = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  full: "9999px",
} as const;
