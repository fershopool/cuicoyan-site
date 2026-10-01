import events from '../data/events.json' with { type: 'json' };
import artists from '../data/artists.json' with { type: 'json' };
import venues from '../data/venues.json' with { type: 'json' };
import categories from '../data/categories.json' with { type: 'json' };
import convocatorias from '../data/convocatorias.json' with { type: 'json' };
import help from '../data/help.json' with { type: 'json' };
import { isVisible } from '../config/content-status.js';
import { environment } from '../config/environment.js';

const visible = (items) => items.filter(isVisible);
export const getEvents = () => visible(events);
export const getArtists = () => visible(artists);
export const getVenues = () => visible(venues);
export const getCategories = () => categories;
export const getCalls = () => visible(convocatorias);
export const getHelp = () => visible(help);
export const getEvent = (slug) => getCachedRemoteEvent(slug) || getEvents().find((item) => item.slug === slug);
export const getArtist = (slug) => getArtists().find((item) => item.slug === slug);
export const getVenue = (slug) => getVenues().find((item) => item.slug === slug);
export const getVenueById = (id) => getVenues().find((item) => item.id === id);
export const getArtistById = (id) => getArtists().find((item) => item.id === id);

const REMOTE_EVENT_CACHE_TTL_MS = 5 * 60 * 1000;
const REMOTE_EVENT_CACHE_MAX_SIZE = 50;
const remoteEventCache = new Map();

function getCachedRemoteEvent(slug) {
  const cached = remoteEventCache.get(slug);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    remoteEventCache.delete(slug);
    return null;
  }
  remoteEventCache.delete(slug);
  remoteEventCache.set(slug, cached);
  return cached.value;
}

function cacheRemoteEvent(slug, value) {
  if (!value) return;
  remoteEventCache.delete(slug);
  remoteEventCache.set(slug, { value, expiresAt: Date.now() + REMOTE_EVENT_CACHE_TTL_MS });
  while (remoteEventCache.size > REMOTE_EVENT_CACHE_MAX_SIZE) {
    remoteEventCache.delete(remoteEventCache.keys().next().value);
  }
}

function apiBaseUrl() {
  return environment.cuicoyanApiUrl.trim();
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') || '';
}

function listValue(value) {
  if (Array.isArray(value)) return value.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') return item.slug || item.category_slug || item.name;
    return '';
  }).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function coordinatesFrom(row) {
  const coordinates = row.coordinates || row.location?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const [longitude, latitude] = coordinates.map(Number);
    if (Number.isFinite(longitude) && Number.isFinite(latitude) && Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90) return [longitude, latitude];
  }
  const longitude = firstValue(row.longitude, row.lng, row.lon, row.location?.longitude);
  const latitude = firstValue(row.latitude, row.lat, row.location?.latitude);
  const parsedLongitude = Number(longitude);
  const parsedLatitude = Number(latitude);
  if (Number.isFinite(parsedLongitude) && Number.isFinite(parsedLatitude) && Math.abs(parsedLongitude) <= 180 && Math.abs(parsedLatitude) <= 90) return [parsedLongitude, parsedLatitude];
  return null;
}

function dateLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function mapRemoteEvent(row) {
  const categories = listValue(firstValue(row.category_slugs, row.categories, row.category));
  const venue = row.space || row.venue || {};
  const venueId = firstValue(row.space_id, row.venue_id, venue.space_id, venue.id);
  const venueName = firstValue(row.space_name, row.venue_name, venue.name, 'Sede por confirmar');
  const venueZone = firstValue(row.neighborhood, row.borough, row.zone, venue.neighborhood, venue.borough, venue.zone, 'CDMX');
  const venueAddress = firstValue(row.address, row.space_address, venue.address);
  return {
    id: firstValue(row.event_id, row.id),
    slug: firstValue(row.event_slug, row.slug),
    title: row.title,
    description: row.description || 'Información por confirmar.',
    startsAt: row.starts_at || row.start_at || '',
    endsAt: row.ends_at || row.end_at || '',
    dateLabel: dateLabel(firstValue(row.starts_at, row.start_at)),
    venueId,
    venueName,
    venueZone,
    venueAddress,
    venueCoordinates: coordinatesFrom(row) || coordinatesFrom(venue),
    venue: venueId ? { id: venueId, slug: firstValue(venue.slug, row.space_slug, venueId), name: venueName, zone: venueZone, address: venueAddress, description: venue.description || venueAddress || 'Sede publicada en Cuicoyan.', categories } : null,
    categorySlugs: categories,
    intentions: [],
    audience: firstValue(row.audience, row.audience_label, 'Todo público'),
    priceLabel: firstValue(row.price_label, row.price, 'Por confirmar'),
    imageTone: 'turquoise',
    imageUrl: row.cover_image_url || '',
    contentStatus: 'approved',
    isDemo: false,
    source: 'cuicoyan-database',
  };
}

export async function loadRemoteEvents() {
  const state = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const baseUrl = apiBaseUrl();
  if (typeof fetch !== 'function') return null;
  if (!baseUrl) return null;

  const endpoint = new URL('/api/cuicoyan/events', baseUrl);
  endpoint.searchParams.set('limit', '100');
  const date = state.get('date') || 'all';
  const today = new Date();
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const iso = (value) => value.toISOString().slice(0, 10);
  if (date === 'today') {
    endpoint.searchParams.set('from', iso(day));
    endpoint.searchParams.set('to', iso(new Date(day.getTime() + 86400000)));
  } else if (date === 'weekend') {
    const saturday = new Date(day);
    saturday.setDate(day.getDate() + (6 - day.getDay() + 7) % 7);
    endpoint.searchParams.set('from', iso(saturday));
    endpoint.searchParams.set('to', iso(new Date(saturday.getTime() + 2 * 86400000)));
  } else if (date === 'month') {
    endpoint.searchParams.set('from', iso(new Date(day.getFullYear(), day.getMonth(), 1)));
    endpoint.searchParams.set('to', iso(new Date(day.getFullYear(), day.getMonth() + 1, 1)));
  }
  if (state.get('zone')) endpoint.searchParams.set('zone', state.get('zone'));
  if (state.get('categoria')) endpoint.searchParams.set('category', state.get('categoria'));
  if (state.get('q')) endpoint.searchParams.set('q', state.get('q'));
  const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Cuicoyan API returned ${response.status}`);

  const body = await response.json();
  if (!Array.isArray(body?.data)) return null;
  const items = body.data.map(mapRemoteEvent).filter((item) => item.slug && item.title);
  return items;
}

export async function loadRemoteEvent(slug) {
  const cached = getCachedRemoteEvent(slug);
  if (cached) return cached;
  const baseUrl = apiBaseUrl();
  if (typeof fetch !== 'function') return getEvent(slug) || null;
  if (!baseUrl) return getEvent(slug) || null;
  try {
    const endpoint = new URL(`/api/cuicoyan/events/${encodeURIComponent(slug)}`, baseUrl);
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Cuicoyan API returned ${response.status}`);
    const body = await response.json();
    const row = body?.data || body?.event || body;
    const item = row && !Array.isArray(row) ? mapRemoteEvent(row) : null;
    cacheRemoteEvent(slug, item);
    return item || getEvent(slug) || null;
  } catch {
    return getEvent(slug) || null;
  }
}

function mapRemoteSpace(row) {
  const categories = listValue(firstValue(row.category_slugs, row.categories, row.category));
  const coordinates = coordinatesFrom(row);
  return {
    id: firstValue(row.space_id, row.venue_id, row.id),
    slug: firstValue(row.space_slug, row.venue_slug, row.slug),
    name: row.name || row.space_name || 'Espacio cultural',
    zone: firstValue(row.neighborhood, row.borough, row.zone, 'CDMX'),
    address: firstValue(row.address, row.street),
    description: row.description || 'Espacio cultural publicado en Cuicoyan.',
    categories,
    coordinates,
    contentStatus: 'approved',
    isDemo: false,
    source: 'cuicoyan-database',
  };
}

export async function loadRemoteSpaces() {
  const baseUrl = apiBaseUrl();
  if (typeof fetch !== 'function') return null;
  if (!baseUrl) return null;
  const response = await fetch(new URL('/api/cuicoyan/spaces', baseUrl), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Cuicoyan API returned ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body?.data)) return null;
  const items = body.data.map(mapRemoteSpace).filter((item) => item.id && item.slug && item.name);
  return items;
}
