export const colors = {
  navy: '#0B1F3A',
  navyMid: '#0E2A4A',
  navySoft: '#163A5F',
  sky: '#2B7BBF',
  skyLight: '#4CA3E0',
  skyMist: '#E8F2FA',
  aqua: '#14C4C8',
  aquaLight: '#5EE8EC',
  aquaMist: '#D9FBFC',
  pink: '#E84B8A',
  pinkSoft: '#F7B6D4',
  coral: '#FF6B4A',
  coralSoft: '#FFB5A3',
  gold: '#FFD76A',
  white: '#FFFFFF',
  offWhite: '#F5F7FA',
  ink: '#0B1F3A',
  muted: '#5C6B7A',
  line: '#D5E3EE',
  danger: '#D64545',
  success: '#1AAE7A',
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
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
};
