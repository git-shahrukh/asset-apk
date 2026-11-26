export const colors = {
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

export type ThemeColors = typeof colors;
