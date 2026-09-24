/**
 * Roman Island POS — Design Tokens
 * Single source of truth for colors, spacing, radii, and typographic constants.
 */

// ─── Color Palette ───────────────────────────────────────────────────────────
export const Colors = {
  // Backgrounds (obsidian dark luxury)
  bg:          '#07090E',
  bgCard:      '#0E1424',
  bgSurface:   '#0A0E1A',
  bgInput:     '#131B2F',
  bgElevated:  '#19223B',

  // Borders
  border:      '#1E293B',
  borderLight: '#161F33',
  borderFocus: '#D4AF37',

  // Brand (Roman Island Gold & Emerald Luxury)
  gold:        '#D4AF37',
  goldBright:  '#F59E0B',
  goldDim:     'rgba(212,175,55,0.12)',
  goldBorder:  'rgba(212,175,55,0.35)',
  goldGlow:    'rgba(212,175,55,0.20)',
  emerald:     '#10B981',
  emeraldDim:  'rgba(16,185,129,0.12)',
  emeraldBorder: 'rgba(16,185,129,0.3)',
  red:         '#EF4444',
  redDim:      'rgba(239,68,68,0.10)',
  redBorder:   'rgba(239,68,68,0.35)',

  // Status
  green:       '#10B981',
  greenDim:    'rgba(16,185,129,0.12)',
  greenBorder: 'rgba(16,185,129,0.3)',
  orange:      '#F97316',
  orangeDim:   'rgba(249,115,22,0.12)',
  orangeBorder:'rgba(249,115,22,0.35)',

  // Tenders
  upi:         '#8B5CF6',
  cash:        '#10B981',
  card:        '#3B82F6',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary:'#E4E4E7',
  textMuted:   '#A1A1AA',
  textDim:     '#71717A',
  textFaint:   '#52525B',
  textGhost:   '#3F3F46',

  // Misc
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
  huge:40,
} as const;

// ─── Border Radii ────────────────────────────────────────────────────────────
export const Radii = {
  xs:    4,
  sm:    8,
  md:   10,
  lg:   12,
  xl:   14,
  xxl:  16,
  pill:  20,
  card:  18,
  sheet: 32,
  full:  9999,
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
export const FontSizes = {
  xs:   10,
  sm:   11,
  body: 13,
  md:   14,
  lg:   15,
  xl:   16,
  xxl:  18,
  title:20,
  hero: 22,
  display:24,
  mega: 26,
  giant:28,
} as const;

export const FontWeights = {
  normal: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

// ─── Layout Constants ────────────────────────────────────────────────────────
export const TABLET_BREAKPOINT = 768;
export const TAB_BAR_HEIGHT_PHONE = 72;
export const TAB_BAR_HEIGHT_TABLET = 82;

// ─── Status Color Map ────────────────────────────────────────────────────────
export const StatusColors = {
  Completed: {
    text: Colors.green,
    bg: Colors.greenDim,
    border: Colors.greenBorder,
    label: 'COMPLETED',
  },
  Refunded: {
    text: Colors.orange,
    bg: Colors.orangeDim,
    border: Colors.orangeBorder,
    label: 'REFUNDED',
  },
  Cancelled: {
    text: Colors.red,
    bg: Colors.redDim,
    border: Colors.redBorder,
    label: 'CANCELLED',
  },
} as const;
