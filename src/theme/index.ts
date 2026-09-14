export const colors = {
  navy: '#0B1F3A',
  navyMid: '#0E2A4A',
  navySoft: '#163A5F',
  sky: '#2B7BBF',
  skyLight: '#4CA3E0',
  skyMist: '#E8F2FA',
  teal: '#0FA8A8',
  tealDeep: '#0B7C8A',
  aqua: '#14C4C8',
  aquaLight: '#5EE8EC',
  aquaMist: '#D9FBFC',
  coral: '#FF6B4A',
  coralSoft: '#FFB5A3',
  coralMist: '#FFF0EB',
  pink: '#E84B8A',
  pinkSoft: '#F7B6D4',
  gold: '#FFD76A',
  white: '#FFFFFF',
  offWhite: '#F5F7FA',
  glass: 'rgba(255,255,255,0.82)',
  glassStrong: 'rgba(255,255,255,0.92)',
  glassSoft: 'rgba(255,255,255,0.55)',
  ink: '#0B1F3A',
  muted: '#5C6B7A',
  line: '#D5E3EE',
  danger: '#D64545',
  success: '#1AAE7A',
  tabBar: '#0A1C33',
  visit: '#14C4C8',
  event: '#FF6B4A',
};

export const statusColors: Record<string, { bg: string; fg: string; label: string }> = {
  programada: { bg: colors.aquaMist, fg: '#0B6E71', label: 'Programada' },
  completada: { bg: '#D9F5EA', fg: '#0F7A52', label: 'Completada' },
  cancelada: { bg: '#FDE8E8', fg: '#B42318', label: 'Cancelada' },
  no_asistio: { bg: '#FFF3D6', fg: '#9A6700', label: 'No asistió' },
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 4,
  },
  fab: {
    shadowColor: colors.tealDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const fonts = {
  script: {
    fontStyle: 'italic' as const,
    fontWeight: '500' as const,
  },
};
