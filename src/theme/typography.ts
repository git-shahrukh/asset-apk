export const fontSizes = {
  display: 32,
  headline: 24,
  title: 20,
  body: 16,
  bodySmall: 14,
  label: 12,
} as const;

export const lineHeights = {
  display: 40,
  headline: 32,
  title: 28,
  body: 24,
  bodySmall: 20,
  label: 16,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const typography = {
  display: { fontSize: fontSizes.display, lineHeight: lineHeights.display, fontWeight: fontWeights.bold },
  headline: { fontSize: fontSizes.headline, lineHeight: lineHeights.headline, fontWeight: fontWeights.bold },
  title: { fontSize: fontSizes.title, lineHeight: lineHeights.title, fontWeight: fontWeights.semibold },
  body: { fontSize: fontSizes.body, lineHeight: lineHeights.body, fontWeight: fontWeights.regular },
  bodySmall: { fontSize: fontSizes.bodySmall, lineHeight: lineHeights.bodySmall, fontWeight: fontWeights.regular },
  label: { fontSize: fontSizes.label, lineHeight: lineHeights.label, fontWeight: fontWeights.medium },
} as const;
