import { siteBase, cuicoyanApiUrl, cuicoyanAllowedOrigins, supabaseUrl, supabaseAnonKey } from './site-base.js';

const isProduction = import.meta.env?.PROD === true || import.meta.env?.MODE === 'production';

function isLocalHost(hostname) {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname.toLowerCase());
}

function validateCuicoyanApiUrl(value, allowedOrigins = []) {
  if (typeof value !== 'string' || !value.trim()) return '';

  try {
    const url = new URL(value.trim());
    const protocolAllowed = url.protocol === 'https:'
      || (!isProduction && url.protocol === 'http:' && isLocalHost(url.hostname));
    if (!protocolAllowed || url.username || url.password) return '';
    const sameOrigin = typeof window !== 'undefined' && url.origin === window.location.origin;
    if (isProduction && !sameOrigin && !allowedOrigins.includes(url.origin)) return '';
    return url.origin;
  } catch {
    return '';
  }
}

const configuredCuicoyanApiUrl = import.meta.env?.VITE_CUICOYAN_API_URL;
const allowedCuicoyanOrigins = String(import.meta.env?.VITE_CUICOYAN_ALLOWED_ORIGINS ?? cuicoyanAllowedOrigins ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const cuicoyanApiBase = configuredCuicoyanApiUrl !== undefined
  ? validateCuicoyanApiUrl(configuredCuicoyanApiUrl, allowedCuicoyanOrigins)
  : validateCuicoyanApiUrl(cuicoyanApiUrl, allowedCuicoyanOrigins);

export const environment = {
  baseUrl: import.meta.env?.VITE_BASE_URL || siteBase || '/',
  cuicoyanApiUrl: cuicoyanApiBase,
  ollinUrl: import.meta.env?.VITE_OLLIN_URL || '',
  externalJoinUrl: import.meta.env?.VITE_EXTERNAL_JOIN_URL || '',
  externalContactUrl: import.meta.env?.VITE_EXTERNAL_CONTACT_URL || '',
  supabaseUrl: import.meta.env?.VITE_SUPABASE_URL || supabaseUrl || '',
  supabaseAnonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || supabaseAnonKey || '',
};
