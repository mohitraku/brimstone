// Brimstone design tokens — dark, warm, sparse.
// PS1-era retro palette: muted embers, charcoal void, no neon.

export const colors = {
  bg: "#0a0a0a",
  surface: "#111111",
  border: "#1a1a1a",

  // Flame — desaturated warm ramp, never hits pure bright
  ember: "#4a1008",
  deepOrange: "#8b3a0f",
  orange: "#b8550f",
  gold: "#c47a1a",
  pale: "#d4a44a",

  // Text — warm low-contrast greys, never pure white
  text: "#b8a89a",
  textFaint: "#5c544c",
  textMuted: "#3a3430",

  // Accent — muted amber/bronze
  accent: "#9e6a20",
  accentFaint: "#5c3d12",

  // States
  danger: "#6b2020",
  success: "#3a4a2a",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  title: 36,
} as const;

export const fonts = {
  regular: "serif",
  gothic: "serif",
} as const;

export const radii = {
  sm: 2,
  md: 4,
  lg: 8,
  full: 9999,
} as const;
