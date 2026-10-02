// Borradores de perfil (artista y foro): diseño y datos editables. Único punto de acceso al almacenamiento.
// ponytail: hoy viven en localStorage (`cuicoyan:profile-draft:<tipo>:<slug>`). Al existir la API, reemplazar
// solo getDraft/saveDraft/removeDraft/listDrafts de este archivo (el resto del código no toca localStorage).
import categories from '../data/categories.json' with { type: 'json' };

const PREFIX = 'cuicoyan:profile-draft:';
const key = (kind, slug) => `${PREFIX}${kind}:${slug}`;

export const COVER_TONES = {
  aurora: ['Aurora', 'var(--profile-hero)'],
  fiesta: ['Fiesta', 'linear-gradient(115deg,#FF9D2E,#F21F6D)'],
  noche: ['Noche', 'linear-gradient(115deg,#12163F,#8A3FFC)'],
  selva: ['Selva', 'linear-gradient(115deg,#00C7D4,#0B7A55)'],
  maiz: ['Cempasúchil', 'linear-gradient(115deg,#FFD66B,#E96F00)'],
  custom: ['Propio', ''],
};
export const FONTS = { moderna: ['Moderna', 'var(--font-app)'], editorial: ['Editorial', 'Georgia, "Times New Roman", serif'], redondeada: ['Redondeada', '"Trebuchet MS", ui-rounded, system-ui, sans-serif'] };
export const SOCIALS = [['instagram', 'Instagram', '@usuario'], ['facebook', 'Facebook', 'facebook.com/…'], ['tiktok', 'TikTok', '@usuario'], ['youtube', 'YouTube', 'youtube.com/@…']];
export const DAYS = [['mon', 'Lunes'], ['tue', 'Martes'], ['wed', 'Miércoles'], ['thu', 'Jueves'], ['fri', 'Viernes'], ['sat', 'Sábado'], ['sun', 'Domingo']];
export const VENUE_TYPES = [['teatro', 'Teatro'], ['casa-cultural', 'Casa cultural'], ['plaza', 'Plaza'], ['galeria', 'Galería'], ['bar', 'Bar'], ['centro-comunitario', 'Centro comunitario'], ['foro', 'Foro / escenario'], ['biblioteca', 'Biblioteca'], ['otro', 'Otro']];
export const SERVICES = [['parking', 'Estacionamiento'], ['restrooms', 'Baños'], ['cafe', 'Cafetería'], ['wifi', 'WiFi'], ['sound', 'Cabina de sonido'], ['dressing', 'Camerinos'], ['lighting', 'Iluminación escénica'], ['bar', 'Bar']];
export const ACCESS = [['ramp', 'Rampa de acceso'], ['wc', 'Baños accesibles'], ['lsm', 'Intérprete de LSM'], ['elevator', 'Elevador'], ['seating', 'Lugares reservados'], ['tactile', 'Señalización táctil'], ['guide', 'Perros guía bienvenidos']];
// Iconos del pin = nombres de components/icons.js
export const PIN_ICONS = [['teatro', 'Teatro'], ['musica', 'Música'], ['danza', 'Danza'], ['flower', 'Flor'], ['cafe', 'Café'], ['galeria', 'Galería'], ['plaza', 'Plaza'], ['casa', 'Casa cultural'], ['biblioteca', 'Biblioteca'], ['talleres', 'Taller'], ['escenario', 'Escenario'], ['sparkles', 'Estrella']];
export const CDMX_BOX = { lat: [19.0, 19.6], lng: [-99.4, -98.9] };

// Puntos aproximados hasta verificar cada espacio (lng, lat).
export const CONCEPTUAL_COORDINATES = {
  'venue-casa-lago': [-99.1855, 19.4244],
  'venue-alicia': [-99.1581, 19.4169],
  'venue-centro-espana': [-99.1324, 19.4346],
  'venue-conchita': [-99.1642, 19.3465],
  'venue-demo-centro': [-99.1405, 19.4261],
};

const slugsOf = (labels = []) => labels.map((l) => categories.find((c) => c.label === l)?.slug).filter(Boolean);
const labelOf = (slug) => categories.find((c) => c.slug === slug)?.label || slug;
const look = () => ({
  cover: { tone: 'aurora', c1: '#00C7D4', c2: '#F21F6D', angle: 115, image: '', pattern: true, height: 260 },
  avatar: { image: '', size: 168, shape: 'circle', ring: true },
  accent: '#E91662', font: 'moderna',
});

export function defaultDraft(kind, record = {}) {
  const r = record._base || record;
  if (kind === 'foro') {
    const cats = slugsOf(r.categories); const c = CONCEPTUAL_COORDINATES[r.id] || r.coordinates || [];
    return {
      name: r.name || '', type: 'foro', bio: (r.description || '').slice(0, 160), longBio: r.description || '',
      address: r.address || '', zone: r.zone || '', directions: '', mapsUrl: '',
      hours: Object.fromEntries(DAYS.map(([d]) => [d, { closed: false, open: '', close: '' }])), hoursNote: '',
      capacity: '', rentMode: 'none', rent: '', services: [], access: [], accessNote: '',
      phone: '', email: '', website: '', social: { instagram: '', facebook: '', tiktok: '', youtube: '' },
      gallery: [], sections: { about: true, info: true, dates: true, gallery: true },
      map: { visible: true, lat: c[1] ?? '', lng: c[0] ?? '', icon: 'flower', color: '#E91662', category: cats[0] || 'musica', extra: cats.slice(1) },
      ...look(),
    };
  }
  return {
    name: r.name || '', discipline: r.discipline || '', tagline: r.tagline || '', bio: r.bio || '', longBio: r.longBio || r.bio || '',
    website: r.website || '', email: r.email || '', social: { instagram: '', facebook: '', tiktok: '', youtube: '' }, categories: r.categorySlugs || [],
    sections: { bio: true, dates: true, posts: true }, ...look(),
  };
}

const merge = (base, extra) => Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v && typeof v === 'object' && !Array.isArray(v) ? merge(v, extra?.[k]) : (extra?.[k] ?? v)]));
export const normalizeDraft = (kind, record, raw) => merge(defaultDraft(kind, record), raw);

// Claves antiguas `profile-draft:<id>` (artista) y `profile-draft:foro-<slug>` → `<tipo>:<slug>`, sin perder datos.
try {
  Object.keys(localStorage).filter((k) => k.startsWith(PREFIX) && !/^(artista|foro):/.test(k.slice(PREFIX.length))).forEach((k) => {
    const id = k.slice(PREFIX.length); const [kind, slug] = id.startsWith('foro-') ? ['foro', id.slice(5)] : ['artista', id];
    if (!localStorage.getItem(key(kind, slug))) localStorage.setItem(key(kind, slug), localStorage.getItem(k));
    localStorage.removeItem(k);
  });
} catch { /* sin almacenamiento */ }

const cache = {};
/** Borradores guardados de un tipo: { slug: objeto }. */
export function listDrafts(kind) {
  if (cache[kind]) return cache[kind];
  const out = {};
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(`${PREFIX}${kind}:`)).forEach((k) => { try { out[k.slice(`${PREFIX}${kind}:`.length)] = JSON.parse(localStorage.getItem(k)); } catch { /* borrador dañado */ } });
  } catch { /* sin almacenamiento */ }
  return (cache[kind] = out);
}
/** Borrador completo (con valores por defecto) o null si ese registro no se ha editado. */
export function getDraft(kind, slug, record) { const raw = listDrafts(kind)[slug]; return raw ? normalizeDraft(kind, record, raw) : null; }
export function saveDraft(kind, slug, draft) {
  try { localStorage.setItem(key(kind, slug), JSON.stringify(draft)); delete cache[kind]; return true; } catch { return false; }
}
export function removeDraft(kind, slug) { try { localStorage.removeItem(key(kind, slug)); } catch { /* sin almacenamiento */ } delete cache[kind]; }

export const inBox = (lat, lng) => lat >= CDMX_BOX.lat[0] && lat <= CDMX_BOX.lat[1] && lng >= CDMX_BOX.lng[0] && lng <= CDMX_BOX.lng[1];
export const validLatLng = (lat, lng) => lat !== '' && lng !== '' && Number.isFinite(+lat) && Number.isFinite(+lng) && Math.abs(+lat) <= 90 && Math.abs(+lng) <= 180;

/** Aplica el borrador a un registro de la lista (tarjetas, mapa, fichas). Conserva el original en `_base`. */
export function withDraft(kind, record) {
  const d = getDraft(kind, record.slug, record);
  if (kind === 'foro') {
    const slugs = d ? [d.map.category, ...d.map.extra].filter(Boolean) : slugsOf(record.categories);
    if (!d) return { ...record, categorySlugs: slugs };
    const c = CONCEPTUAL_COORDINATES[record.id]; const ok = validLatLng(d.map.lat, d.map.lng);
    const moved = ok && (!c || +d.map.lng !== c[0] || +d.map.lat !== c[1]);
    return {
      ...record, _base: record, draft: d, name: d.name || record.name, description: d.bio || record.description, zone: d.zone || record.zone, address: d.address || '',
      categories: slugs.map(labelOf), categorySlugs: slugs, mapVisible: d.map.visible, mapIcon: d.map.icon, mapColor: d.map.color, photo: d.avatar.image || d.cover.image || '',
      ...(ok ? { coordinates: [+d.map.lng, +d.map.lat] } : {}), mapPoint: moved && record.mapPoint ? { ...record.mapPoint, isConceptual: false } : record.mapPoint,
    };
  }
  return d ? { ...record, _base: record, draft: d, name: d.name || record.name, discipline: d.discipline || record.discipline, tagline: d.tagline || record.tagline, bio: d.bio || record.bio, categorySlugs: d.categories, photo: d.avatar.image } : record;
}
