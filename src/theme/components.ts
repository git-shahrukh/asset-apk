export const componentTokens = {
  iconSize: {
    small: 16,
    medium: 20,
    large: 24,
    extraLarge: 32,
  },
  touchTarget: {
    minimum: 44,
    comfortable: 48,
  },
  button: {
    height: 48,
    radius: 12,
    horizontalPadding: 20,
    gap: 8,
  },
  input: {
    height: 52,
    radius: 12,
    horizontalPadding: 16,
    verticalPadding: 12,
  },
  card: {
    radius: 16,
    padding: 16,
    borderWidth: 1,
  },
  module: {
    height: 192,
    logoSize: 56,
    titleSlotHeight: 48,
    subtitleSlotHeight: 40,
  },
  state: {
    iconSize: 56,
  },
  brand: {
    frameSize: 88,
    logoSize: 64,
  },
  image: {
    previewHeight: 240,
  },
  duration: {
    inputWidth: 80,
  },
  location: {
    mapHeight: 280,
  },
  ocr: {
    lineHeight: 10,
  },
  system: {
    statusBar: 'dark' as const,
  },
  navigation: {
    logoutIconSize: 36,
  },
  menu: {
    maxHeight: 240,
    itemHeight: 48,
  },
  layout: {
    screenPadding: 16,
    sectionGap: 24,
    fieldGap: 16,
  },
  focusRing: {
    width: 2,
  },
} as const;
