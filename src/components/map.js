import { el } from '../utils/dom.js';
import { routes, withBase } from '../config/routes.js';
import { icon } from './icons.js';
import { CONCEPTUAL_COORDINATES as conceptualCoordinates } from '../services/profile-draft.service.js';

// MapLibre exige URL absolutas para sprites, glifos y fuentes de datos.
const cartographyRoot = new URL(withBase('/src/assets/cartografia'), window.location.origin).href.replace(/\/$/, '');
const mapStyleUrl = `${cartographyRoot}/estilos/cuicoyan-style.local.json`;
const maplibreUrl = `${cartographyRoot}/recursos/vendor/maplibre-gl.mjs`;
const maplibreWorkerUrl = `${cartographyRoot}/recursos/vendor/maplibre-gl-worker.mjs`;
const pmtilesUrl = `${cartographyRoot}/recursos/vendor/pmtiles.js`;

let mapEnginePromise;
let pmtilesRegistered = false;

function loadScript(src) {
  if (window.pmtiles?.Protocol) return Promise.resolve(window.pmtiles);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => window.pmtiles?.Protocol ? resolve(window.pmtiles) : reject(new Error('No se encontró el lector PMTiles.'));
    script.onerror = () => reject(new Error('No se pudo cargar el lector PMTiles local.'));
    document.head.append(script);
  });
}

export async function getMapEngine() {
  if (!mapEnginePromise) {
    mapEnginePromise = (async () => {
      const maplibre = await import(maplibreUrl);
      const pmtiles = await loadScript(pmtilesUrl);
      maplibre.setWorkerUrl(maplibreWorkerUrl);
      if (!pmtilesRegistered) {
        maplibre.addProtocol('pmtiles', new pmtiles.Protocol().tile);
        pmtilesRegistered = true;
      }
      return maplibre;
    })();
  }
  return mapEnginePromise;
}

export async function loadMapStyle() {
  const response = await fetch(mapStyleUrl, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`No se pudo cargar el estilo cartográfico (${response.status}).`);
  const style = await response.json();
  const fonts = `${cartographyRoot}/recursos/basemaps-assets-main/fonts`;
  const sprites = `${cartographyRoot}/recursos/basemaps-assets-main/sprites/v4/light`;
  style.glyphs = `${fonts}/{fontstack}/{range}.pbf`;
  style.sprite = sprites;
  style.sources.cuicoyan.url = `pmtiles://${cartographyRoot}/mapas/cdmx.pmtiles`;
  // Líneas de alcaldía más suaves para que el mapa se lea como en los mockups.
  for (const layer of style.layers) {
    if (layer.id === 'alcaldias-divisiones') layer.paint = { ...layer.paint, 'line-opacity': 0.34, 'line-width': ['interpolate', ['linear'], ['zoom'], 8.5, 0.8, 12, 1.2, 15, 1.6], 'line-dasharray': [3, 2] };
  }
  style.sources['alcaldias-cdmx'].data = `${cartographyRoot}/limites/cdmx.geojson`;
  style.sources['fuera-cdmx'].data = `${cartographyRoot}/limites/fuera-cdmx.geojson`;
  style.sources.proximamente.data = `${cartographyRoot}/limites/proximamente-cdmx.geojson`;
  return style;
}

function venueCoordinates(venue) {
  return venue.coordinates || conceptualCoordinates[venue.id];
}

function createPopupContent(venue) {
  const isConceptual = venue.mapPoint?.isConceptual;
  return el('div', { className: 'map-popup' }, [
    el('strong', { text: venue.name }),
    el('span', { text: `${venue.zone} · ${venue.categories.join(' · ')}` }),
    isConceptual ? el('small', { text: 'Punto conceptual · por verificar' }) : venue.address ? el('small', { text: venue.address }) : null,
    el('a', { href: routes.foro(venue.slug), text: 'Ver espacio' }),
  ]);
}

/** Pin del mapa; `mapIcon`/`mapColor` vienen del perfil del foro (por defecto, la flor y el azul de marca). */
export function paintPin(marker, { mapIcon, mapColor }) {
  marker.firstElementChild.replaceChildren(icon(mapIcon || 'flower', { size: 20, strokeWidth: 1.6 }));
  if (mapColor) { marker.dataset.custom = ''; marker.style.setProperty('--pin-color', mapColor); } else { delete marker.dataset.custom; marker.style.removeProperty('--pin-color'); }
}

export function createMarkerElement(venue, tag = 'button') {
  const marker = el(tag, { className: 'cartography-marker', attrs: tag === 'button' ? { type: 'button', 'aria-label': `Seleccionar ${venue.name}`, 'aria-pressed': 'false', title: venue.name } : { 'aria-hidden': 'true' } }, [el('span', { attrs: { 'aria-hidden': 'true' } })]);
  paintPin(marker, venue);
  return marker;
}

function mountCartography(mapCard, canvas, venues, select, status) {
  window.setTimeout(async () => {
    if (!mapCard.isConnected) return;
    try {
      const [maplibre, style] = await Promise.all([getMapEngine(), loadMapStyle()]);
      const map = new maplibre.Map({
        container: canvas,
        style,
        center: [-99.1532, 19.4126],
        zoom: 11.4,
        minZoom: 8.5,
        maxZoom: 18,
        maxBounds: [[-99.6, 18.9], [-98.7, 19.75]],
        attributionControl: true,
      });
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-right');
      const markers = new Map();

      map.on('load', () => {
        venues.forEach((venue) => {
          const coordinates = venueCoordinates(venue);
          if (!coordinates) return;
          const markerElement = createMarkerElement(venue);
          const marker = new maplibre.Marker({ element: markerElement, anchor: 'bottom' })
            .setLngLat(coordinates)
            .setPopup(new maplibre.Popup({ offset: 18, closeButton: true }).setDOMContent(createPopupContent(venue)))
            .addTo(map);
          markerElement.addEventListener('click', () => select(venue.id, { center: true }));
          markers.set(venue.id, { marker, element: markerElement });
        });
        const located = venues.map(venueCoordinates).filter(Boolean);
        if (located.length > 1) {
          const bounds = located.reduce((box, point) => box.extend(point), new maplibre.LngLatBounds(located[0], located[0]));
          map.fitBounds(bounds, { padding: { top: 70, right: 40, bottom: 50, left: 40 }, maxZoom: 12.6, duration: 0 });
        }
        mapCard._applyFilter?.();
        mapCard.classList.add('map-ready');
        const published = venues.filter((venue) => venue.coordinates);
        status.textContent = published.length ? `Cartografía local activa · ${markers.size} espacios publicados` : `Cartografía local activa · ${markers.size} espacios conceptuales`;
        select(venues.find((venue) => venue.id === 'venue-alicia')?.id || venues[0]?.id);
        map.resize();
      });

      map.on('error', (event) => {
        const message = event.error?.message || 'No se pudo cargar la cartografía local.';
        status.textContent = message;
      });

      mapCard._cuicoyanMap = map;
      mapCard._cuicoyanMarkers = markers;
    } catch (error) {
      mapCard.classList.add('map-fallback');
      status.textContent = `Mapa conceptual activo · ${error.message}`;
    }
  }, 0);
}

export function mapView(venues, selectedId = 'venue-alicia', onSelect = null) {
  const list = el('div', { className: 'map-list', attrs: { 'aria-label': 'Espacios del mapa' } });
  const canvas = el('div', { className: 'map-canvas', attrs: { 'aria-label': 'Cartografía local de la Ciudad de México' } });
  const status = el('span', { className: 'map-status', text: 'Cargando cartografía local…', attrs: { role: 'status', 'aria-live': 'polite' } });
  const map = el('div', { className: 'map-card', role: 'region', attrs: { 'aria-label': 'Mapa cultural de espacios de CDMX' } }, [canvas, status]);

  function select(id, options = {}) {
    const chosen = venues.find((item) => item.id === id);
    if (chosen && onSelect) onSelect(chosen);
    map.querySelectorAll('.map-pin').forEach((pin, index) => pin.setAttribute('aria-pressed', String(venues[index]?.id === id)));
    map.querySelectorAll('.cartography-marker').forEach((pin) => pin.setAttribute('aria-pressed', String(pin.getAttribute('aria-label') === `Seleccionar ${venues.find((venue) => venue.id === id)?.name}`)));
    list.querySelectorAll('[data-venue-id]').forEach((item) => item.classList.toggle('active', item.dataset.venueId === id));
    if (options.center && map._cuicoyanMap) {
      const venue = venues.find((item) => item.id === id);
      const coordinates = venue && venueCoordinates(venue);
      if (coordinates) map._cuicoyanMap.flyTo({ center: coordinates, zoom: Math.max(map._cuicoyanMap.getZoom(), 11.5), essential: true });
    }
  }

  venues.forEach((venue, index) => {
    const isConceptual = venue.mapPoint?.isConceptual;
    if (isConceptual) {
      const point = venue.mapPoint;
      const pin = el('button', { className: 'map-pin', type: 'button', dataset: { venueId: venue.id }, style: `left:${point.x}%;top:${point.y}%`, attrs: { 'aria-label': `Seleccionar ${venue.name}`, 'aria-pressed': String(venue.id === selectedId) } }, [el('span', { text: String(index + 1) })]);
      pin.addEventListener('click', () => select(venue.id, { center: true }));
      map.append(pin);
    }
    const item = el('a', { className: `map-list-item${venue.id === selectedId ? ' active' : ''}`, href: routes.foro(venue.slug), dataset: { venueId: venue.id } }, [el('strong', { text: venue.name }), el('span', { className: 'muted', text: `${venue.zone} · ${venue.categories.join(' · ')}` }), venue.mapPoint?.isConceptual ? el('small', { className: 'muted', text: 'Punto conceptual · por verificar' }) : null]);
    item.addEventListener('mouseenter', () => select(venue.id));
    item.addEventListener('focus', () => select(venue.id));
    list.append(item);
  });

  // Filtro por categoría (principal o secundaria del foro): oculta pines y filas; devuelve los ids visibles.
  let current = 'todos';
  const matches = (venue) => current === 'todos' || (venue.categorySlugs || []).includes(current);
  map._applyFilter = () => venues.forEach((venue) => {
    const on = matches(venue);
    const marker = map._cuicoyanMarkers?.get(venue.id); if (marker) marker.element.hidden = !on;
    list.querySelector(`[data-venue-id="${venue.id}"]`)?.toggleAttribute('hidden', !on);
    map.querySelector(`.map-pin[data-venue-id="${venue.id}"]`)?.toggleAttribute('hidden', !on);
  });
  function filter(slug) { current = slug; map._applyFilter(); return venues.filter(matches).map((venue) => venue.id); }

  mountCartography(map, canvas, venues, select, status);
  return { map, list, select, filter };
}
