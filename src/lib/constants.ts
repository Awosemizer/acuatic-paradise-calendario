export const SERVICE_TYPES = [
  'Recorrido',
  'Consulta de paquete',
  'Apartado de fecha',
  'Cumpleaños',
  'XV años',
  'Boda',
  'Reunión',
  'Otro',
] as const;

export const DURATION_OPTIONS = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 h' },
  { minutes: 90, label: '1.5 h' },
  { minutes: 120, label: '2 h' },
  { minutes: 180, label: '3 h' },
  { minutes: 240, label: '4 h' },
  { minutes: 300, label: '5 h' },
  { minutes: 420, label: '7 h' },
] as const;

export const VISIT_STATUSES = [
  { value: 'programada', label: 'Programada' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'no_asistio', label: 'No asistió' },
] as const;

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 22;
export const HOUR_HEIGHT = 64;
