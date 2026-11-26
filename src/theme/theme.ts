import { colors } from './colors';
import { componentTokens } from './components';
import { elevation } from './elevation';
import { motion } from './motion';
import { shape } from './shape';
import { spacing } from './spacing';
import { typography } from './typography';

export const lightTheme = {
  colors,
  typography,
  spacing,
  shape,
  elevation,
  motion,
  components: componentTokens,
} as const;

export type AppTheme = typeof lightTheme;
