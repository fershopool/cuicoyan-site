import { environment } from '../config/environment.js';

const sessionKey = 'cuicoyan:auth-session';

function authConfig() {
  return environment.supabaseUrl && environment.supabaseAnonKey ? { url: environment.supabaseUrl.replace(/\/$/, ''), key: environment.supabaseAnonKey } : null;
}

function readStoredSession() {
  try {
    const value = sessionStorage.getItem(sessionKey);
    const session = value ? JSON.parse(value) : null;
    return session?.access_token ? session : null;
  } catch {
    return null;
  }
}

function storeSession(session) {
  if (!session?.access_token) return null;
  const safe = { access_token: session.access_token, refresh_token: session.refresh_token || '', expires_at: session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600) };
  sessionStorage.setItem(sessionKey, JSON.stringify(safe));
  return safe;
}

export function consumeAuthRedirect() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  if (accessToken && refreshToken) {
    storeSession({ access_token: accessToken, refresh_token: refreshToken, expires_in: hash.get('expires_in'), expires_at: hash.get('expires_at') });
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  }
  return readStoredSession();
}

async function refreshSession(session) {
  const config = authConfig();
  if (!config || !session?.refresh_token) return session;
  const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: config.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refresh_token }) });
  if (!response.ok) return null;
  return storeSession(await response.json());
}

export async function getSession() {
  let session = readStoredSession();
  if (!session) return null;
  if (Number(session.expires_at) * 1000 - Date.now() < 60_000) session = await refreshSession(session);
  return session;
}

async function authRequest(path, options = {}) {
  const config = authConfig();
  if (!config) throw new Error('La autenticación pública aún no está configurada');
  const session = await getSession();
  if (!session) throw new Error('Sesión requerida');
  const response = await fetch(`${config.url}${path}`, { ...options, headers: { apikey: config.key, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error('No se pudo actualizar la cuenta');
  return response.status === 204 ? null : response.json();
}

export async function setPassword(password) {
  if (typeof password !== 'string' || password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
  return authRequest('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password }) });
}

export async function apiRequest(path, options = {}) {
  const session = await getSession();
  if (!session) throw new Error('Sesión requerida');
  if (!environment.cuicoyanApiUrl) throw new Error('La API de Cuicoyan aún no está configurada');
  const response = await fetch(new URL(path, environment.cuicoyanApiUrl), { ...options, headers: { Accept: 'application/json', Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'No se pudo completar la operación');
  return body;
}

export function invitationId() {
  return new URLSearchParams(window.location.search).get('invitation_id') || '';
}

export function clearSession() {
  sessionStorage.removeItem(sessionKey);
}
