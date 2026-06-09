/**
 * Digital Storefront design tokens — from stitch_kiranapos_mobile_ui_design.
 * Brutalist tactile POS: thick borders, saffron CTAs, no shadows.
 */

export const KiranaColors = {
  background: '#fff8f5',
  surface: '#ffffff',
  surfaceDim: '#fdebdf',
  surfaceContainer: '#fdebdf',
  onSurface: '#231a13',
  onSurfaceVariant: '#554336',
  outline: '#887364',
  outlineVariant: '#dbc2b0',
  primary: '#8f4e00',
  primaryContainer: '#ff9933',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#693800',
  navy: '#1a2b3c',
  secondary: '#4f6073',
  secondaryContainer: '#d2e4fb',
  tertiary: '#006685',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  success: '#1b7a3d',
  successContainer: '#c8f5d4',
  warning: '#c45a00',
  modalBackdrop: 'rgba(26, 43, 60, 0.6)',
  scannerFrame: '#ff9933',
  tabActiveBg: '#ff9933',
  tabInactiveBg: '#fff8f5',
  owed: '#ba1a1a',
  settled: '#1b7a3d',
  avatarOrange: '#ff9933',
  avatarBlue: '#6cd2ff',
  avatarTeal: '#00c0f7',
} as const;

export const KiranaSpacing = {
  touchMin: 56,
  gutter: 16,
  marginPage: 24,
  stackGap: 12,
  checkoutHeight: 64,
} as const;

export const KiranaRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const KiranaBorder = {
  card: 2,
  focus: 3,
  hairline: 1,
} as const;

export const KiranaFonts = {
  headline: 'Anybody_700Bold',
  headlineMedium: 'Anybody_600SemiBold',
  body: 'WorkSans_400Regular',
  bodyMedium: 'WorkSans_500Medium',
  bodySemiBold: 'WorkSans_600SemiBold',
  label: 'ArchivoNarrow_700Bold',
  mono: 'JetBrainsMono_700Bold',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const KiranaType = {
  headlineLg: { fontFamily: KiranaFonts.headline, fontSize: 34, lineHeight: 36 },
  headlineMd: { fontFamily: KiranaFonts.headlineMedium, fontSize: 24, lineHeight: 26 },
  bodyLg: { fontFamily: KiranaFonts.bodyMedium, fontSize: 19, lineHeight: 22 },
  bodyMd: { fontFamily: KiranaFonts.body, fontSize: 17, lineHeight: 20 },
  labelCaps: {
    fontFamily: KiranaFonts.label,
    fontSize: 13,
    lineHeight: 15,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  priceDisplay: { fontFamily: KiranaFonts.mono, fontSize: 38, lineHeight: 40 },
  priceSub: { fontFamily: KiranaFonts.monoMedium, fontSize: 21, lineHeight: 24 },
  priceLine: { fontFamily: KiranaFonts.monoMedium, fontSize: 20, lineHeight: 22 },
} as const;
