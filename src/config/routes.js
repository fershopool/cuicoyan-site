import { environment } from './environment.js';

const base = (environment.baseUrl || '/').replace(/\/+$/, '');
export function withBase(path) {
  if (!path || path === '#') return path;
  if (path.startsWith('#')) return base ? `${base}/${path}` : `/${path}`;
  if (path.startsWith('http')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}` || '/';
}

export const routes = {
  home: withBase('/'), explorar: withBase('/explorar/'), eventos: withBase('/eventos/'), artistas: withBase('/artistas/'), foros: withBase('/foros/'), mapa: withBase('/mapa/'),
  favoritos: withBase('/favoritos/'), onboarding: withBase('/onboarding/intereses/'), creadores: withBase('/para-creadores/'), unete: withBase('/unete/'),
  convocatorias: withBase('/convocatorias/'), sobre: withBase('/sobre-cuicoyan/'), ayuda: withBase('/ayuda/'), accesibilidad: withBase('/accesibilidad/'),
  privacidad: withBase('/privacidad/'), terminos: withBase('/terminos/'), evento: (slug) => withBase(`/eventos/${slug}/`), artista: (slug) => withBase(`/artistas/${slug}/`), foro: (slug) => withBase(`/foros/${slug}/`),
};

export function routeForPath(pathname = window.location.pathname) {
  const prefix = base || '';
  const relative = prefix && pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
  const clean = relative.replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
  if (clean === '/') return 'home';
  if (clean.startsWith('/eventos/') && clean !== '/eventos') return 'evento-detalle';
  if (clean.startsWith('/artistas/') && clean !== '/artistas') return 'artista-detalle';
  if (clean.startsWith('/foros/') && clean !== '/foros') return 'foro-detalle';
  return ({'/explorar':'explorar','/eventos':'eventos','/artistas':'artistas','/foros':'foros','/mapa':'mapa','/favoritos':'favoritos','/onboarding/intereses':'onboarding','/para-creadores':'creadores','/unete':'unete','/convocatorias':'convocatorias','/sobre-cuicoyan':'sobre','/ayuda':'ayuda','/accesibilidad':'accesibilidad','/privacidad':'privacidad','/terminos':'terminos'})[clean] || 'not-found';
}
