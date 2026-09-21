import { el } from '../utils/dom.js';
import { routes, withBase } from '../config/routes.js';

const cartographyRoot = withBase('/src/assets/cartografia');
const mapStyleUrl = `${cartographyRoot}/estilos/cuicoyan-style.local.json`;
const maplibreUrl = `${cartographyRoot}/recursos/vendor/maplibre-gl.mjs`;
const maplibreWorkerUrl = `${cartographyRoot}/recursos/vendor/maplibre-gl-worker.mjs`;
const pmtilesUrl = `${cartographyRoot}/recursos/vendor/pmtiles.js`;

// Coordinates are intentionally approximate until each space is verified.
const conceptualCoordinates = {
  'venue-casa-lago': [-99.1855, 19.4244],
  'venue-alicia': [-99.1581, 19.4169],
  'venue-centro-espana': [-99.1324, 19.4346],
  'venue-conchita': [-99.1642, 19.3465],
  'venue-demo-centro': [-99.1405, 19.4261],
};

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

async function getMapEngine() {
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

async function loadMapStyle() {
  const response = await fetch(mapStyleUrl, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`No se pudo cargar el estilo cartográfico (${response.status}).`);
  const style = await response.json();
  const fonts = `${cartographyRoot}/recursos/basemaps-assets-main/fonts`;
  const sprites = `${cartographyRoot}/recursos/basemaps-assets-main/sprites/v4/light`;
  style.glyphs = `${fonts}/{fontstack}/{range}.pbf`;
  style.sprite = sprites;
  style.sources.cuicoyan.url = `pmtiles://${cartographyRoot}/mapas/cdmx.pmtiles`;
  style.sources['alcaldias-cdmx'].data = `${cartographyRoot}/limites/cdmx.geojson`;
  style.sources['fuera-cdmx'].data = `${cartographyRoot}/limites/fuera-cdmx.geojson`;
  style.sources.proximamente.data = `${cartographyRoot}/limites/proximamente-cdmx.geojson`;
  return style;
}

function venueCoordinates(venue) {
  return venue.coordinates || conceptualCoordinates[venue.id];
}

function createPopupContent(venue) {
  return el('div', { className: 'map-popup' }, [
    el('strong', { text: venue.name }),
    el('span', { text: `${venue.zone} · ${venue.categories.join(' · ')}` }),
    el('small', { text: 'Punto conceptual · por verificar' }),
    el('a', { href: routes.foro(venue.slug), text: 'Ver espacio' }),
  ]);
}

function createMarkerElement(venue) {
  return el('button', {
    className: 'cartography-marker',
    type: 'button',
    attrs: {
      'aria-label': `Seleccionar ${venue.name}`,
      'aria-pressed': 'false',
      title: venue.name,
    },
  }, [el('span', { text: '•', attrs: { 'aria-hidden': 'true' } })]);
}

function mountCartography(mapCard, canvas, venues, select, status) {
  window.setTimeout(async () => {
    if (!mapCard.isConnected) return;
    try {
      const [maplibre, style] = await Promise.all([getMapEngine(), loadMapStyle()]);
      const map = new maplibre.Map({
        container: canvas,
        style,
        center: [-99.1332, 19.4326],
        zoom: 9.6,
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
        mapCard.classList.add('map-ready');
        status.textContent = `Cartografía local activa · ${markers.size} espacios demostrativos`;
        select('venue-alicia');
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

export function mapView(venues, selectedId = 'venue-alicia') {
  const list = el('div', { className: 'map-list', attrs: { 'aria-label': 'Espacios del mapa' } });
  const canvas = el('div', { className: 'map-canvas', attrs: { 'aria-label': 'Cartografía local de la Ciudad de México' } });
  const status = el('span', { className: 'map-status', text: 'Cargando cartografía local…', attrs: { role: 'status', 'aria-live': 'polite' } });
  const map = el('div', { className: 'map-card', role: 'region', attrs: { 'aria-label': 'Mapa cultural de espacios de CDMX' } }, [canvas, status]);

  function select(id, options = {}) {
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
    const point = venue.mapPoint || { x: 50, y: 50 };
    const pin = el('button', { className: 'map-pin', type: 'button', style: `left:${point.x}%;top:${point.y}%`, attrs: { 'aria-label': `Seleccionar ${venue.name}`, 'aria-pressed': String(venue.id === selectedId) } }, [el('span', { text: String(index + 1) })]);
    pin.addEventListener('click', () => select(venue.id, { center: true }));
    map.append(pin);
    const item = el('a', { className: `map-list-item${venue.id === selectedId ? ' active' : ''}`, href: routes.foro(venue.slug), dataset: { venueId: venue.id } }, [el('strong', { text: venue.name }), el('span', { className: 'muted', text: `${venue.zone} · ${venue.categories.join(' · ')}` }), venue.mapPoint?.isConceptual ? el('small', { className: 'muted', text: 'Punto conceptual · por verificar' }) : null]);
    item.addEventListener('mouseenter', () => select(venue.id));
    item.addEventListener('focus', () => select(venue.id));
    list.append(item);
  });

  mountCartography(map, canvas, venues, select, status);
  return { map, list };
}
