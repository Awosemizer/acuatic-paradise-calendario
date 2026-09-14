export type VisitStatus = 'programada' | 'completada' | 'cancelada' | 'no_asistio';

export type Profile = {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
};

export type Visit = {
  id: string;
  client_name: string;
  phone: string | null;
  service_type: string;
  starts_at: string;
  duration_minutes: number;
  notes: string | null;
  status: VisitStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  starts_at: string;
  duration_minutes: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarItem =
  | { kind: 'visit'; data: Visit }
  | { kind: 'event'; data: CalendarEvent };

export type CalendarView = 'day' | 'week' | 'month';
