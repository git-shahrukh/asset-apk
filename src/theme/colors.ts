export const lightColors = {
  primary: '#1A73E8',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D3E3FD',
  onPrimaryContainer: '#174EA6',

  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F3F4',
  surfaceContainer: '#F8FAFD',

  textPrimary: '#202124',
  textSecondary: '#5F6368',
  textDisabled: '#9AA0A6',
  outline: '#DADCE0',
  outlineFocused: '#1A73E8',

  error: '#B3261E',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#8C1D18',
  success: '#137333',
  successContainer: '#CEEAD6',
  warning: '#B06000',
  warningContainer: '#FEF7E0',

  scrim: '#000000',
} as const;

export const darkColors = {
  primary: '#A8C7FA',
  onPrimary: '#0B2E59',
  primaryContainer: '#174EA6',
  onPrimaryContainer: '#D3E3FD',

  background: '#101418',
  surface: '#1B1F23',
  surfaceVariant: '#2A3036',
  surfaceContainer: '#20252B',

  textPrimary: '#F1F3F4',
  textSecondary: '#BDC1C6',
  textDisabled: '#7F858B',
  outline: '#5F6368',
  outlineFocused: '#A8C7FA',

  error: '#F2B8B5',
  errorContainer: '#601410',
  onErrorContainer: '#F9DEDC',
  success: '#81C995',
  successContainer: '#0F3D22',
  warning: '#FDD663',
  warningContainer: '#4A3300',

  scrim: '#000000',
} as const;

// Backward-compatible alias for code that imports the light palette directly.
// Components should use theme.colors so they react to the active color scheme.
export const colors = lightColors;

export type ThemeColors = { [Key in keyof typeof lightColors]: string };
