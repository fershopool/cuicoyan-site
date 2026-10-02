// Editor de foro cultural: identidad, ubicación, horarios, servicios, galería y presencia en el mapa.
import { el, announce } from '../utils/dom.js';
import { routes } from '../config/routes.js';
import { icon } from './icons.js';
import { getCategories } from '../services/content.service.js';
import { DAYS, VENUE_TYPES, SERVICES, ACCESS, PIN_ICONS, defaultDraft, getDraft, inBox, validLatLng } from '../services/profile-draft.service.js';
import { createEditor, lookCards, socialFields, readImage, required, urlOk, emailOk, phoneOk, PALETTE } from './profile-kit.js';
import { createMarkerElement, paintPin, getMapEngine, loadMapStyle } from './map.js';

const CDMX_CENTER = [-99.1332, 19.4326];
const MAX_PHOTOS = 6;
const coordCheck = (range, label) => (v) => (v === '' ? '' : !Number.isFinite(+v) || +v < range[0] || +v > range[1] ? `${label} debe estar entre ${range[0]} y ${range[1]}.` : '');
const coordWarn = (v, d) => (validLatLng(d.map.lat, d.map.lng) && !inBox(+d.map.lat, +d.map.lng) ? 'Este punto queda fuera de la Ciudad de México; revísalo.' : '');

function hoursCard(kit) {
  const rows = DAYS.map(([key, name]) => el('div', { className: 'pe-hours-row', attrs: { role: 'group', 'aria-label': name } }, [
    el('strong', { text: name }),
    kit.toggle(`hours.${key}.closed`, 'Cerrado'),
    el('span', { className: 'pe-hours-times' }, [kit.control(`hours.${key}.open`, { type: 'time', label: `${name}: abre` }), el('i', { text: '–', attrs: { 'aria-hidden': 'true' } }), kit.control(`hours.${key}.close`, { type: 'time', label: `${name}: cierra` })]),
  ]));
  return kit.card('clock', 'Horarios', [el('div', { className: 'pe-hours wide' }, rows), kit.text('hoursNote', 'Nota de horario especial', { area: true, max: 300, rows: 2, placeholder: 'Días festivos, funciones nocturnas…' })]);
}

function galleryCard(kit, draft) {
  const list = el('ul', { className: 'pe-gallery wide' });
  const add = el('input', { type: 'file', accept: 'image/*', multiple: true, className: 'sr-only', onchange: async (event) => {
    const files = [...event.target.files].slice(0, MAX_PHOTOS - draft.gallery.length); event.target.value = '';
    try { for (const file of files) draft.gallery.push(await readImage(file, 1100, false)); } catch (error) { announce(error.message); }
    kit.changed();
  } });
  const addLabel = el('label', { className: 'button secondary' }, [icon('plus', { size: 20 }), 'Agregar fotos', add]);
  const move = (i, by) => { const to = i + by; if (to < 0 || to >= draft.gallery.length) return; [draft.gallery[i], draft.gallery[to]] = [draft.gallery[to], draft.gallery[i]]; kit.changed(); announce(`Foto movida a la posición ${to + 1}`); };
  const act = (label, i, handler, glyph) => el('button', { type: 'button', className: 'pe-thumb-btn', text: glyph, attrs: { 'aria-label': `${label} (foto ${i + 1})` }, onclick: handler });
  kit.refreshers.push(() => {
    list.replaceChildren(...draft.gallery.map((src, i) => el('li', { className: 'pe-thumb' }, [el('img', { src, alt: `Foto ${i + 1}` }), el('span', { className: 'pe-thumb-actions' }, [act('Mover antes', i, () => move(i, -1), '←'), act('Mover después', i, () => move(i, 1), '→'), act('Quitar', i, () => { draft.gallery.splice(i, 1); kit.changed(); announce('Foto quitada'); }, '✕')])])));
    addLabel.hidden = draft.gallery.length >= MAX_PHOTOS;
  });
  return kit.card('image', 'Galería', [list, addLabel], `Hasta ${MAX_PHOTOS} fotos; se reducen para caber en el navegador.`);
}

// Mini mapa: toca o arrastra el pin; con el pin enfocado, las flechas lo mueven (Mayús = pasos grandes).
function locationPicker(kit, draft) {
  const canvas = el('div', { className: 'pe-map', attrs: { 'aria-label': 'Mapa para colocar el pin' } });
  const status = el('p', { className: 'muted pe-hint', attrs: { role: 'status' }, text: 'Cargando mapa…' });
  const geoError = el('small', { className: 'pe-err', attrs: { role: 'alert' } });
  const pin = createMarkerElement({ name: 'Pin del foro', mapIcon: draft.map.icon, mapColor: draft.map.color });
  pin.setAttribute('aria-label', 'Pin del foro. Usa las flechas para moverlo; Mayús para pasos grandes.');
  let map; let marker;
  const position = () => (validLatLng(draft.map.lat, draft.map.lng) ? [+draft.map.lng, +draft.map.lat] : null);
  const place = (lng, lat) => { draft.map.lat = lat.toFixed(5); draft.map.lng = lng.toFixed(5); kit.changed(); };
  pin.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 0.005 : 0.0005; const [lng, lat] = position() || CDMX_CENTER;
    const move = { ArrowUp: [0, step], ArrowDown: [0, -step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }[event.key];
    if (!move) return;
    event.preventDefault(); place(lng + move[0], lat + move[1]); announce(`Latitud ${draft.map.lat}, longitud ${draft.map.lng}`);
  });
  kit.refreshers.push(() => {
    const at = position();
    if (marker && at) { marker.setLngLat(at); }
    if (marker) marker.getElement().style.visibility = at ? '' : 'hidden';
    if (map && at && !map.getBounds().contains(at)) map.easeTo({ center: at });
  });
  const here = el('button', { type: 'button', className: 'button secondary', onclick: () => {
    geoError.textContent = '';
    if (!navigator.geolocation) { geoError.textContent = 'Tu navegador no permite obtener la ubicación. Escribe las coordenadas o toca el mapa.'; return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { place(coords.longitude, coords.latitude); announce('Ubicación actual aplicada'); },
      (error) => { geoError.textContent = error.code === 1 ? 'Permiso de ubicación denegado. Actívalo en el navegador, escribe las coordenadas o toca el mapa.' : 'No se pudo obtener tu ubicación. Escribe las coordenadas o toca el mapa.'; },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  } }, [icon('pin', { size: 20 }), 'Usar mi ubicación']);
  window.setTimeout(async () => {
    if (!canvas.isConnected) return;
    try {
      const [maplibre, style] = await Promise.all([getMapEngine(), loadMapStyle()]);
      const at = position();
      map = new maplibre.Map({ container: canvas, style, center: at || CDMX_CENTER, zoom: at ? 14 : 11, minZoom: 8.5, maxZoom: 18, maxBounds: [[-99.6, 18.9], [-98.7, 19.75]] });
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-right');
      marker = new maplibre.Marker({ element: pin, anchor: 'bottom', draggable: true }).setLngLat(at || CDMX_CENTER).addTo(map);
      pin.style.visibility = at ? '' : 'hidden';
      marker.on('dragend', () => { const p = marker.getLngLat(); place(p.lng, p.lat); });
      map.on('click', (event) => { place(event.lngLat.lng, event.lngLat.lat); pin.focus({ preventScroll: true }); });
      map.on('load', () => map.resize());
      status.textContent = 'Toca el mapa o arrastra el pin para colocarlo.';
    } catch (error) { status.textContent = 'El mapa no está disponible; escribe latitud y longitud.'; }
  }, 0);
  return { nodes: [canvas, status, here, geoError], repaintPin: () => paintPin(pin, { mapIcon: draft.map.icon, mapColor: draft.map.color }) };
}

function mapCard(kit, draft) {
  const { text, choices, select, toggle, color, card, refreshers } = kit;
  const categories = getCategories().filter((c) => c.slug !== 'todos');
  const picker = locationPicker(kit, draft);
  refreshers.push(picker.repaintPin);
  // Vista previa del pin y de su ventana, como en el mapa público.
  const previewPin = el('span', { className: 'pe-preview-pin' });
  const previewText = el('div', { className: 'map-popup' });
  refreshers.push(() => {
    const label = categories.find((c) => c.slug === draft.map.category)?.label || '';
    previewPin.replaceChildren(createMarkerElement({ mapIcon: draft.map.icon, mapColor: draft.map.color }, 'span'));
    previewText.replaceChildren(el('strong', { text: draft.name || 'Nombre del foro' }), el('span', { text: [draft.zone, label].filter(Boolean).join(' · ') }), draft.address ? el('small', { text: draft.address }) : null);
  });
  const secondary = choices('Categorías secundarias', categories.map((c) => [c.slug, c.label]), (v) => draft.map.extra.includes(v), (v) => { draft.map.extra = draft.map.extra.includes(v) ? draft.map.extra.filter((c) => c !== v) : [...draft.map.extra, v]; });
  refreshers.push(() => { draft.map.extra = draft.map.extra.filter((c) => c !== draft.map.category); });
  const body = [
    toggle('map.visible', 'Publicar mi foro en el mapa'),
    el('div', { className: 'pe-preview wide' }, [previewPin, previewText]),
    select('map.category', 'Categoría principal (filtro del mapa)', categories.map((c) => [c.slug, c.label]), true), secondary,
    choices('Icono del pin', PIN_ICONS.map(([value, name]) => [value, name, '', value]), (v) => draft.map.icon === v, (v) => { draft.map.icon = v; }, 'pin-icon'),
    choices('Color del pin', PALETTE.map((c) => [c, c, `background:${c}`]), (v) => draft.map.color === v, (v) => { draft.map.color = v; }, 'swatch'), color('map.color', 'Color propio'),
    text('map.lat', 'Latitud', { inputmode: 'decimal', max: 12, placeholder: '19.4326', check: coordCheck([-90, 90], 'La latitud'), warn: coordWarn }),
    text('map.lng', 'Longitud', { inputmode: 'decimal', max: 13, placeholder: '-99.1332', check: coordCheck([-180, 180], 'La longitud') }),
    el('div', { className: 'pe-map-wrap wide' }, picker.nodes),
  ];
  return card('map', 'Aparece en el mapa', body, 'Si desmarcas «Publicar», el foro no aparece en el mapa pero conserva su ficha.');
}

export function renderVenueEditor({ venue, switcher }) {
  return createEditor({
    kind: 'foro', slug: venue.slug, record: venue, base: defaultDraft('foro', venue), saved: getDraft('foro', venue.slug, venue),
    heroOptions: { eyebrow: 'Foro cultural · CDMX', tags: (d) => [VENUE_TYPES.find(([value]) => value === d.type)?.[1], d.zone] },
    heading: { eyebrow: 'Mi foro', title: 'Edita tu foro' }, backHref: routes.foros, backLabel: 'Foros', publicHref: routes.foro(venue.slug), switcher,
    note: el('p', { className: 'demo-note', text: 'Sin sesión activa: tus cambios se guardan solo en este navegador.' }),
    build: (kit, draft) => {
      const { text, select, toggle, checkGroup, card } = kit;
      const [coverCard, styleCard] = lookCards(kit, draft);
      const rent = text('rent', 'Precio de renta', { max: 80, placeholder: 'Desde $… por hora' });
      kit.refreshers.push(() => { rent.hidden = draft.rentMode !== 'price'; });
      return [
        card('flower', 'Identidad', [text('name', 'Nombre del espacio', { max: 160, check: required('El nombre') }), select('type', 'Tipo de espacio', VENUE_TYPES), text('bio', 'Descripción corta', { area: true, max: 160, rows: 2 }), text('longBio', 'Descripción larga', { area: true, max: 5000, rows: 6 })]),
        coverCard,
        card('pin', 'Ubicación', [text('address', 'Dirección', { max: 200, wide: true }), text('zone', 'Colonia o zona', { max: 80 }), text('mapsUrl', 'Enlace de Google Maps (opcional)', { type: 'url', max: 500, placeholder: 'https://maps.google.com/…', check: urlOk }), text('directions', 'Referencias para llegar', { area: true, max: 400, rows: 2, placeholder: 'Cerca del metro…, entrada por…' })]),
        hoursCard(kit),
        card('users', 'Aforo y renta', [text('capacity', 'Aforo (personas)', { type: 'number', max: 6, inputmode: 'numeric', check: (v) => (v === '' || (Number.isInteger(+v) && +v >= 0) ? '' : 'Escribe un número entero.') }), select('rentMode', 'Renta del espacio', [['none', 'No mostrar'], ['contact', 'Contáctanos'], ['price', 'Mostrar precio']]), rent]),
        card('sparkles', 'Servicios', [checkGroup('services', 'Servicios del espacio', SERVICES)]),
        card('access', 'Accesibilidad', [checkGroup('access', 'Accesibilidad del espacio', ACCESS), text('accessNote', 'Nota de accesibilidad', { area: true, max: 400, rows: 2 })]),
        card('phone', 'Contacto y redes', [text('phone', 'Teléfono', { type: 'tel', max: 24, check: phoneOk }), text('email', 'Correo público', { type: 'email', max: 320, check: emailOk }), text('website', 'Sitio web', { type: 'url', max: 500, placeholder: 'https://', check: urlOk }), ...socialFields(kit)]),
        galleryCard(kit, draft),
        mapCard(kit, draft),
        styleCard,
        card('settings', 'Secciones visibles', [toggle('sections.about', 'Sobre el espacio'), toggle('sections.info', 'Información del lugar'), toggle('sections.dates', 'Próximas fechas'), toggle('sections.gallery', 'Galería')]),
      ];
    },
  });
}
