/** Dominio sintético: el staff inicia sesión con usuario, no con correo real. */
export const AUTH_EMAIL_DOMAIN = 'acuaticparadise.com';

const USERNAME_RE = /^[a-z0-9._]+$/;

/**
 * Normaliza el nombre de usuario (trim + minúsculas).
 * Solo permite letras, números, guion bajo y punto.
 */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return username.length > 0 && USERNAME_RE.test(username);
}

/** Mapea usuario → correo sintético para Supabase Auth. */
export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}

/**
 * Extrae el usuario desde un correo sintético (o el local-part de cualquier email).
 */
export function emailToUsername(email: string | null | undefined): string | null {
  if (!email) return null;
  const local = email.split('@')[0]?.trim().toLowerCase();
  return local || null;
}
