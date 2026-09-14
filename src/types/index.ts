export type VisitStatus = 'programada' | 'completada' | 'cancelada' | 'no_asistio';

export type Profile = {
  id: string;
  full_name: string;
  username: string | null;
  role: string;
  avatar_url?: string | null;
  bio?: string | null;
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

export type Task = {
  id: string;
  title: string;
  done: boolean;
  due_at: string | null;
  created_by: string | null;
  created_at: string;
  is_personal: boolean;
};

export type BitacoraArea = 'piscina' | 'salon' | 'general';

export type BitacoraStatus = 'al_dia' | 'pronto' | 'vencido';

export type BitacoraItem = {
  id: string;
  area: BitacoraArea;
  title: string;
  description: string | null;
  interval_days: number;
  last_done_at: string | null;
  notes: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BitacoraLog = {
  id: string;
  item_id: string;
  done_at: string;
  done_by: string | null;
  notes: string | null;
  created_at: string;
};
