import type { Profile } from '@/src/types';

export function isAdmin(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  const role = String(profile.role ?? '').toLowerCase();
  return (role === 'ceo' || role === 'admin') && profile.is_active !== false;
}

export function canEditCalendar(profile: Profile | null | undefined): boolean {
  if (!profile || profile.is_active === false) return false;
  return isAdmin(profile) || !!profile.can_edit_calendar;
}

export function canEditBitacora(profile: Profile | null | undefined): boolean {
  if (!profile || profile.is_active === false) return false;
  return isAdmin(profile) || !!profile.can_edit_bitacora;
}

export function canEditTasks(profile: Profile | null | undefined): boolean {
  if (!profile || profile.is_active === false) return false;
  return isAdmin(profile) || !!profile.can_edit_tasks;
}

export function roleLabel(role: string | null | undefined): string {
  switch (String(role ?? '').toLowerCase()) {
    case 'ceo':
      return 'CEO';
    case 'admin':
      return 'Administrador';
    default:
      return 'Staff';
  }
}
