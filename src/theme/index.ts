export const colors = {
  background: '#0B1220',
  panel: '#111A2E',
  panelElevated: '#16213A',
  panelHover: '#1A2742',
  border: '#1E2A44',
  borderLight: '#2B3B5E',
  accent: '#22D3EE',
  accentMuted: 'rgba(34, 211, 238, 0.12)',
  accentBorder: 'rgba(34, 211, 238, 0.30)',
  text: '#E6EDF7',
  muted: '#8FA0BC',
  error: '#F87171',
  errorBackground: 'rgba(248, 113, 113, 0.12)',
  errorBorder: 'rgba(248, 113, 113, 0.35)',
  success: '#34D399',
  successBackground: 'rgba(52, 211, 153, 0.12)',
  successBorder: 'rgba(52, 211, 153, 0.30)',
  white: '#FFFFFF',
  googleButtonText: '#111827',
  overlay: 'rgba(5, 10, 20, 0.72)',
} as const;

// 8px grid spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Rounded corners (8-12px)
export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  pill: 9999,
} as const;

export const breakpoints = {
  tablet: 768,
  desktop: 960,
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  breakpoints,
} as const;

export type Theme = typeof theme;
