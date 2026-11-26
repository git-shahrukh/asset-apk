import { darkColors, lightColors, ThemeColors } from './colors';
import { componentTokens } from './components';
import { elevation } from './elevation';
import { motion } from './motion';
import { shape } from './shape';
import { spacing } from './spacing';
import { typography } from './typography';

function createTheme(themeColors: ThemeColors) {
  return {
    colors: themeColors,
    typography,
    spacing,
    shape,
    elevation,
    motion,
    components: componentTokens,
  } as const;
}

export const lightTheme = createTheme(lightColors);
export const darkTheme = createTheme(darkColors);

export type AppTheme = typeof lightTheme;
