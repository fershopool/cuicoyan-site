// Pantallas con el lenguaje de los mockups: Artistas, Favoritos, Mapa y fichas (artista, espacio, evento).
import { el, $, announce } from '../utils/dom.js';
import { routes, withBase } from '../config/routes.js';
import { normalizeText } from '../utils/normalize-text.js';
import { icon } from './icons.js';
import { favoriteButton, eventDateParts, eventArtKeys, eventImageUrl, venueImageUrl, asset, avatar } from './cards.js';
import { getFavorites, isFavorite, toggleFavorite } from '../services/favorites.service.js';
import { getCategories, getVenueById, getArtistById } from '../services/content.service.js';
import { mapView } from './map.js';

const mount = (main) => { $('#app').replaceWith(main); return main; };
const labelOf = () => Object.fromEntries(getCategories().map((category) => [category.slug, category.label]));
const shortDate = (label) => eventDateParts(label).date.toLowerCase();
const isDemo = (item) => item?.isDemo !== false;
const demoNote = (text = 'Contenido demostrativo: verifica datos, derechos y canales antes de publicar.') => el('p', { className: 'demo-note', text });
const wrap = (className, children) => mount(el('main', { id: 'contenido', className: `app-page ${className}` }, [el('div', { className: 'app-wrap' }, children)]));
const pageHead = (eyebrow, title, aside) => el('header', { className: 'app-head' }, [el('div', {}, [el('span', { className: 'eyebrow', text: eyebrow }), el('h1', { text: title })]), aside]);
const backLink = (label, href) => el('a', { className: 'back-link', href }, [icon('back', { size: 24 }), el('span', { text: label })]);
const sectionTitle = (iconName, text, aside) => el('div', { className: 'block-title' }, [el('h2', {}, [icon(iconName, { size: 24 }), text]), aside || null]);
const seeAll = (href, text = 'Ver todas') => el('a', { className: 'see-all', href }, [text, icon('chevron', { size: 16 })]);

function eventPicture(event, className = 'ev-img') {
  const key = eventArtKeys[event.slug];
  if (key) return ['light', 'dark'].map((mode) => el('img', { className: `${className} mode-${mode}`, src: asset(`${key}-${mode}`), alt: '', loading: 'lazy', decoding: 'async' }));
  const url = eventImageUrl(event);
  return url ? [el('img', { className, src: url, alt: '', loading: 'lazy', decoding: 'async' })] : [];
}

// Fila compacta de evento (fichas de artista y de espacio).
export function eventRow(event) {
  const venue = getVenueById(event.venueId);
  const { date, time } = eventDateParts(event.dateLabel);
  const labels = labelOf();
  const tone = { huapango: 'rose', fandango: 'azure', teatro: 'ember', musica: 'violet', danza: 'violet' }[event.categorySlugs?.[0]] || 'rose';
  return el('article', { className: 'event-row', dataset: { tone } }, [
    el('span', { className: 'event-row-cal', attrs: { 'aria-hidden': 'true' } }, [icon('calendar', { size: 34, strokeWidth: 1.5 })]),
    el('div', { className: 'event-row-main' }, [
      el('p', { className: 'event-row-date' }, [el('strong', { text: date }), time ? el('span', { text: time }) : null]),
      el('h3', {}, [el('a', { href: routes.evento(event.slug), text: event.title })]),
      el('p', { className: 'event-row-venue' }, [icon('pin', { size: 18 }), event.venueName || venue?.name || 'Sede por confirmar']),
      el('div', { className: 'row-foot' }, [el('div', { className: 'ev-tags' }, (event.categorySlugs || []).map((slug) => el('span', { className: 'ev-tag', dataset: { cat: slug }, text: labels[slug] || slug }))), el('strong', { className: 'row-price', text: event.priceLabel })]),
    ]),
    favoriteButton('event', event.id, event.title),
  ]);
}

/* ---------------------------------------------------------------- Artistas */
export function artistRow(artist, next) {
  return el('article', { className: 'artist-row' }, [
    el('span', { className: 'artist-avatar' }, [avatar(artist)]),
    el('div', { className: 'artist-main' }, [
      el('h3', {}, [el('a', { href: routes.artista(artist.slug), text: artist.name })]),
      el('p', { className: 'artist-tags' }, [el('span', { text: artist.discipline }), el('i', { text: '•', attrs: { 'aria-hidden': 'true' } }), el('span', { text: artist.tagline })]),
      el('p', { className: 'artist-bio', text: artist.bio }),
      next ? el('p', { className: 'artist-next' }, [icon('calendar', { size: 16 }), `Próximo: ${shortDate(next.dateLabel)} • ${next.title}`]) : null,
    ]),
    favoriteButton('artist', artist.id, artist.name),
  ]);
}

export function venueRow(venue) {
  const photo = venueImageUrl(venue) || (venue.slug === 'foro-alicia' ? asset('fav-foro') : '');
  return el('article', { className: 'venue-row' }, [
    el('span', { className: 'venue-thumb' }, [photo ? el('img', { src: photo, alt: '', loading: 'lazy', decoding: 'async' }) : el('span', { className: 'venue-thumb-fallback', attrs: { 'aria-hidden': 'true' } }, [icon('flower', { size: 36, strokeWidth: 1.4 })])]),
    el('div', { className: 'venue-row-main' }, [
      el('h3', {}, [el('a', { href: routes.foro(venue.slug), text: venue.name })]),
      el('p', { className: 'venue-row-where' }, [el('strong', { text: venue.zone }), venue.address ? ` • ${venue.address}` : '']),
      el('p', { className: 'artist-bio', text: venue.description }),
    ]),
    favoriteButton('venue', venue.id, venue.name),
  ]);
}


export function renderArtistsPage(artists, events) {
  const state = { tab: 'conocer', q: '', discipline: '' };
  const list = el('div', { className: 'artist-list', attrs: { 'aria-live': 'polite' } });
  const count = el('span', { className: 'app-count' });
  const eventOf = (artist) => events.find((event) => event.id === artist.nextEventId);
  const disciplines = [...new Set(artists.map((artist) => artist.discipline))];

  const stories = el('div', { className: 'stories', attrs: { role: 'list', 'aria-label': 'Perfiles destacados' } }, artists.map((artist) => el('a', { className: 'story', href: routes.artista(artist.slug), attrs: { role: 'listitem' } }, [el('span', { className: 'story-ring' }, [avatar(artist)]), el('span', { text: artist.name.split(' ')[0] })])));
  const tabs = [['conocer', 'Conocer más'], ['tribu', 'Mi tribu']].map(([key, label]) => { const button = el('button', { className: 'seg', type: 'button', text: label, attrs: { role: 'tab' } }); button.addEventListener('click', () => { state.tab = key; paint(); }); button.dataset.key = key; return button; });
  const input = el('input', { type: 'search', name: 'q', placeholder: 'Busca por nombre o disciplina', attrs: { 'aria-label': 'Buscar artistas' } });
  input.addEventListener('input', () => { state.q = input.value; paint(); });
  const pills = ['', ...disciplines].map((discipline) => { const pill = el('button', { className: 'filter-pill', type: 'button', text: discipline || 'Todas' }); pill.dataset.value = discipline; pill.addEventListener('click', () => { state.discipline = discipline; paint(); }); return pill; });
  const pillRow = el('div', { className: 'filter-pills', attrs: { role: 'group', 'aria-label': 'Disciplina' } }, pills);
  pillRow.hidden = true;
  const filterButton = el('button', { className: 'filter-button', type: 'button', attrs: { 'aria-label': 'Filtrar por disciplina', 'aria-expanded': 'false' } }, [icon('filter', { size: 22 })]);
  filterButton.addEventListener('click', () => { pillRow.hidden = !pillRow.hidden; filterButton.setAttribute('aria-expanded', String(!pillRow.hidden)); });

  const row = (artist) => artistRow(artist, eventOf(artist));
  function paint() {
    const query = normalizeText(state.q);
    let items = artists.filter((artist) => !query || normalizeText(`${artist.name} ${artist.discipline} ${artist.tagline} ${artist.bio}`).includes(query));
    if (state.discipline) items = items.filter((artist) => artist.discipline === state.discipline);
    if (state.tab === 'tribu') items = items.filter((artist) => isFavorite('artist', artist.id));
    tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.key === state.tab)));
    pills.forEach((pill) => pill.setAttribute('aria-pressed', String(pill.dataset.value === state.discipline)));
    const empty = state.tab === 'tribu' && !state.q && !state.discipline
      ? el('div', { className: 'empty-state' }, [el('h3', { text: 'Tu tribu está por empezar' }), el('p', { className: 'muted', text: 'Toca el corazón de un perfil en «Conocer más» para guardarlo aquí.' })])
      : el('div', { className: 'empty-state' }, [el('h3', { text: 'No encontramos artistas' }), el('p', { className: 'muted', text: 'Prueba otra palabra o quita el filtro de disciplina.' })]);
    list.replaceChildren(...(items.length ? items.map(row) : [empty]));
  }
  list.addEventListener('click', (event) => { if (state.tab === 'tribu' && event.target.closest('.favorite-button')) window.setTimeout(paint, 0); });
  count.textContent = `${artists.length} perfiles`;
  wrap('artists-page', [pageHead('Personas y colectivos', 'Artistas', count), stories, el('div', { className: 'segmented', attrs: { role: 'tablist', 'aria-label': 'Vista de artistas' } }, tabs), el('div', { className: 'app-search' }, [icon('search', { size: 24 }), input, filterButton]), pillRow, list, demoNote('Perfiles demostrativos, sin cuentas ni seguimiento remoto.')]);
  paint();
}

/* --------------------------------------------------------------- Favoritos */
export function renderFavoritesPage({ events, artists, venues }) {
  const state = { type: 'all' };
  const labels = labelOf();
  const list = el('div', { className: 'fav-list', attrs: { 'aria-live': 'polite' } });
  const thumbs = { event: { 'sones-del-barrio': 'fav-evento' }, artist: { 'raices-del-viento': 'fav-artista' }, venue: { 'foro-alicia': 'fav-foro' } };
  const kinds = [['all', 'Todo', 'clover'], ['event', 'Eventos', 'calendar'], ['artist', 'Artistas', 'users'], ['venue', 'Espacios', 'pin']];
  const pills = kinds.map(([key, label, iconName]) => { const pill = el('button', { className: 'fav-pill', type: 'button', dataset: { kind: key } }, [icon(iconName, { size: 22 }), el('span', { text: label })]); pill.addEventListener('click', () => { state.type = key; paint(); }); return pill; });

  function thumb(type, item) {
    const file = thumbs[type]?.[item.slug];
    if (file) return el('img', { src: asset(file), alt: '', loading: 'lazy', decoding: 'async' });
    if (type === 'artist') return avatar(item, 'fav-avatar');
    if (type === 'event') { const images = eventPicture(item, 'fav-photo'); if (images.length) return el('span', { className: 'fav-photo-wrap' }, images); }
    if (type === 'venue' && venueImageUrl(item)) return el('img', { src: venueImageUrl(item), alt: '', loading: 'lazy', decoding: 'async' });
    return el('span', { className: 'fav-placeholder' }, [icon(type === 'event' ? 'calendar' : type === 'venue' ? 'pin' : 'users', { size: 34 })]);
  }
  function favRow({ type, item }) {
    const heart = favoriteButton(type, item.id, item.title || item.name);
    const typeIcon = { event: 'calendar', artist: 'users', venue: 'pin' }[type];
    let body;
    if (type === 'event') {
      const { date, time } = eventDateParts(item.dateLabel);
      body = [el('p', { className: 'fav-meta fav-date' }, [el('strong', { text: date }), time ? el('span', { text: `• ${time}` }) : null]), el('h3', {}, [el('a', { href: routes.evento(item.slug), text: item.title })]), el('div', { className: 'row-foot' }, [el('div', { className: 'ev-tags' }, (item.categorySlugs || []).map((slug) => el('span', { className: 'ev-tag', dataset: { cat: slug }, text: labels[slug] || slug }))), el('strong', { className: 'row-price', text: item.priceLabel })])];
    } else if (type === 'artist') {
      body = [el('h3', {}, [el('a', { href: routes.artista(item.slug), text: item.name })]), el('p', { className: 'fav-meta fav-tags' }, [item.discipline, ' • ', item.tagline]), el('p', { className: 'fav-bio', text: item.bio })];
    } else {
      body = [el('h3', {}, [el('a', { href: routes.foro(item.slug), text: item.name })]), el('p', { className: 'fav-meta fav-zone' }, [el('strong', { text: item.zone }), item.address ? ` • ${item.address}` : '']), el('p', { className: 'fav-bio', text: item.description })];
    }
    return el('article', { className: 'fav-item', dataset: { type } }, [el('div', { className: 'fav-thumb' }, [thumb(type, item), el('span', { className: 'fav-badge', attrs: { 'aria-hidden': 'true' } }, [icon(typeIcon, { size: 22 })])]), el('div', { className: 'fav-body' }, body), heart]);
  }
  const resolve = () => getFavorites().map(({ type, id }) => { const item = type === 'event' ? events.find((x) => x.id === id) : type === 'artist' ? artists.find((x) => x.id === id) : venues.find((x) => x.id === id); return item ? { type, item } : null; }).filter(Boolean);

  function paint() {
    const saved = resolve();
    const shown = state.type === 'all' ? saved : saved.filter((entry) => entry.type === state.type);
    pills.forEach((pill) => pill.setAttribute('aria-pressed', String(pill.dataset.kind === state.type)));
    if (shown.length) { list.replaceChildren(...shown.map(favRow)); return; }
    const suggestions = [{ type: 'event', item: events[0] }, { type: 'artist', item: artists.find((a) => a.slug === 'raices-del-viento') || artists[0] }, { type: 'venue', item: venues.find((v) => v.slug === 'foro-alicia') || venues[0] }].filter((entry) => entry.item && (state.type === 'all' || state.type === entry.type));
    list.replaceChildren(el('div', { className: 'empty-state' }, [el('h3', { text: saved.length ? 'Nada guardado en esta categoría' : 'Aún no guardas nada' }), el('p', { className: 'muted', text: 'Toca el corazón en eventos, artistas y espacios para volver a ellos después.' }), el('a', { className: 'button', href: routes.explorar, text: 'Explorar Cuicoyan' })]), suggestions.length ? el('p', { className: 'fav-suggest', text: 'Para empezar' }) : null, ...suggestions.map(favRow));
  }
  list.addEventListener('click', (event) => { if (event.target.closest('.favorite-button')) window.setTimeout(paint, 0); });

  const banner = el('section', { className: 'fav-banner' }, [el('img', { className: 'fav-banner-art', src: asset('fav-banner'), alt: '', decoding: 'async' }), el('span', { className: 'fav-banner-heart', attrs: { 'aria-hidden': 'true' } }, [icon('heart', { size: 76, strokeWidth: 1.2 })]), el('div', { className: 'fav-banner-copy' }, [el('h2', { text: 'Tu colección curada' }), el('p', { text: 'Los artistas, eventos y espacios que te inspiran.' })])]);
  const note = el('p', { className: 'fav-note' }, [icon('phoneDevice', { size: 26 }), 'Tus favoritos se guardan únicamente en este dispositivo.']);
  wrap('favorites-page', [pageHead('Tu selección', 'Favoritos', el('a', { className: 'app-link', href: routes.onboarding }, [icon('settings', { size: 26 }), 'Ajustes'])), el('div', { className: 'fav-pills', attrs: { role: 'group', 'aria-label': 'Tipo de favorito' } }, pills), banner, list, note, demoNote()]);
  paint();
}

/* -------------------------------------------------------------------- Mapa */
const placeWhere = (venue) => [venue.zone, venue.address || (venue.mapPoint?.isConceptual ? 'Punto conceptual · por verificar' : '')].filter(Boolean).join(' · ');
const placeBadge = () => el('span', { className: 'place-badge', attrs: { 'aria-hidden': 'true' } }, [icon('flower', { size: 28, strokeWidth: 1.5 })]);

// Mapa + lista de espacios (compartido por la página de mapa y la portada).
export function mapBlock(venues, initialId, onSelect) {
  const initial = venues.find((venue) => venue.id === initialId) || venues[0];
  const rows = venues.map((venue) => { const row = el('a', { className: 'place-row', href: routes.foro(venue.slug), dataset: { venueId: venue.id } }, [placeBadge(), el('span', { className: 'place-link-text' }, [el('strong', { text: venue.name }), el('span', { text: placeWhere(venue) })]), icon('chevron', { size: 22 })]); row.addEventListener('mouseenter', () => view.select(venue.id)); row.addEventListener('focus', () => view.select(venue.id)); return row; });
  const view = mapView(venues, initial.id, (venue) => { rows.forEach((row) => row.classList.toggle('active', row.dataset.venueId === venue.id)); onSelect?.(venue); });
  const shell = el('div', { className: 'map-shell' }, [view.map, el('span', { className: 'map-region' }, [icon('pin', { size: 22 }), 'CDMX', icon('chevron', { size: 16, className: 'caret' })])]);
  rows.forEach((row) => row.classList.toggle('active', row.dataset.venueId === initial.id));
  return { shell, rows, initial };
}

export function renderMapPage(venues) {
  const numberWords = { 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis' };
  const selectedTitle = el('h2');
  const selectedCopy = el('p', { className: 'place-selected-copy' });
  const selectedLink = el('a', { className: 'place-link' });
  function paintSelected(venue) {
    selectedTitle.textContent = venue.name;
    selectedCopy.textContent = venue.description;
    selectedLink.replaceChildren(placeBadge(), el('span', { className: 'place-link-text' }, [el('strong', { text: venue.name }), el('span', { text: placeWhere(venue) })]), icon('chevron', { size: 22 }));
    selectedLink.href = routes.foro(venue.slug);
  }
  const { shell, rows, initial } = mapBlock(venues, 'venue-alicia', paintSelected);
  const head = el('header', { className: 'map-head' }, [el('div', { className: 'map-head-copy' }, [el('span', { className: 'eyebrow deco', text: 'Explora la ciudad' }), el('h1', { text: 'Mapa cultural' }), el('p', { text: 'Un vistazo a los foros y espacios culturales de CDMX.' })]), el('img', { className: 'map-head-art', src: asset('palacio-mapa'), alt: '', decoding: 'async' })]);
  const selected = el('section', { className: 'place-selected', attrs: { 'aria-live': 'polite' } }, [el('span', { className: 'eyebrow', text: 'Lugar seleccionado' }), selectedTitle, selectedCopy, selectedLink]);
  const places = el('section', { className: 'place-list' }, [el('div', { className: 'block-title' }, [el('h2', { text: `${numberWords[venues.length] || venues.length} espacios para comenzar` }), el('span', { className: 'see-all' }, ['CDMX', icon('chevron', { size: 16 })])]), el('div', { className: 'place-rows' }, rows)]);
  paintSelected(initial);
  wrap('map-page', [head, el('div', { className: 'map-grid' }, [el('div', { className: 'map-col' }, [shell, selected]), el('div', { className: 'map-col' }, [places])]), demoNote('Cada punto del mapa es conceptual y está pendiente de verificación geográfica. Mapa: © OpenStreetMap / Protomaps.')]);
}

/* ------------------------------------------------------------------ Fichas */
export function renderArtistProfile(artist, { events }) {
  const next = events.filter((event) => event.id === artist.nextEventId || (event.artistIds || []).includes(artist.id));
  const quetzal = artist.slug === 'raices-del-viento';
  const art = quetzal ? el('img', { className: 'profile-quetzal', src: asset('quetzal'), alt: '', decoding: 'async' }) : el('span', { className: 'profile-portrait' }, [avatar(artist)]);
  const hero = el('section', { className: 'profile-hero', dataset: { tone: artist.tone || 'pink' } }, [el('div', { className: 'profile-copy' }, [el('span', { className: 'eyebrow', text: 'Artes vivas · CDMX' }), el('h1', { text: artist.name }), el('p', { className: 'profile-tags' }, [artist.discipline, ' • ', artist.tagline]), el('p', { className: 'profile-short', text: artist.bio })]), art, favoriteButton('artist', artist.id, artist.name)]);
  const bio = el('section', { className: 'profile-block' }, [sectionTitle('flower', 'Biografía'), el('p', { className: 'profile-bio', text: artist.longBio || artist.bio })]);
  const dates = el('section', { className: 'profile-block' }, [sectionTitle('calendar', 'Próximas fechas', seeAll(routes.eventos)), next.length ? el('div', { className: 'event-rows' }, next.map(eventRow)) : el('p', { className: 'muted', text: 'Aún no hay fechas confirmadas.' })]);
  wrap('profile-page', [backLink('Regresar', routes.artistas), hero, bio, dates, isDemo(artist) ? demoNote('Perfil demostrativo: no se muestran contacto, redes ni métricas hasta contar con autorización.') : null]);
}

export function renderVenueProfile(venue, { events }) {
  const at = events.filter((event) => event.venueId === venue.id);
  const photo = venueImageUrl(venue) || (venue.slug === 'foro-alicia' ? asset('foro-alicia-hero') : '');
  const hero = el('section', { className: `venue-hero${photo ? '' : ' no-photo'}` }, [photo ? el('img', { className: 'venue-hero-photo', src: venue.slug === 'foro-alicia' ? asset('foro-alicia-hero') : photo, alt: '', decoding: 'async' }) : null, el('div', { className: 'venue-hero-copy' }, [el('span', { className: 'venue-kicker' }, [el('span', { className: 'place-badge small', attrs: { 'aria-hidden': 'true' } }, [icon('flower', { size: 20, strokeWidth: 1.6 })]), 'Foro cultural · CDMX']), el('h1', { text: venue.name }), el('p', { text: venue.description })])]);
  const info = [['pin', 'Dirección', [venue.zone, venue.address].filter(Boolean).join(' · ')], ['clock', 'Horario', 'Por confirmar'], ['phone', 'Contacto', 'Por confirmar'], ['access', 'Accesibilidad', 'Por confirmar']];
  const card = el('section', { className: 'venue-info' }, [el('h3', {}, [icon('flower', { size: 22 }), 'Información del lugar']), el('div', { className: 'venue-info-grid' }, [el('dl', {}, info.map(([iconName, term, value]) => el('div', {}, [icon(iconName, { size: 24 }), el('dt', { text: term }), el('dd', { text: value })]))), el('div', { className: 'venue-minimap' }, [el('span', { className: 'minimap-pin', attrs: { 'aria-hidden': 'true' } }, [icon('flower', { size: 26, strokeWidth: 1.5 })]), el('span', { className: 'minimap-zone', text: venue.zone }), el('a', { className: 'minimap-link', href: `${routes.mapa}?foro=${venue.slug}` }, ['Ver en mapa', icon('external', { size: 18 })])])])]);
  wrap('venue-page', [el('div', { className: 'detail-back' }, [el('a', { className: 'back-circle', href: routes.foros, attrs: { 'aria-label': 'Volver a foros' } }, [icon('back', { size: 24 })]), el('span', { text: 'Detalle del espacio' })]), hero, el('section', { className: 'profile-block' }, [sectionTitle('flower', 'Sobre el espacio'), el('p', { className: 'profile-bio', text: venue.description })]), card, el('section', { className: 'profile-block' }, [sectionTitle('flower', 'Próximas fechas', seeAll(routes.eventos)), at.length ? el('div', { className: 'event-rows' }, at.map(eventRow)) : el('p', { className: 'muted', text: 'Aún no hay fechas confirmadas.' })]), isDemo(venue) ? demoNote('Espacio demostrativo: horarios, contacto y accesibilidad requieren una fuente aprobada.') : null]);
}

export function renderEventDetail(item, { artists }) {
  const venue = item.venue || getVenueById(item.venueId) || (item.venueName ? { id: item.venueId, slug: item.venueId || item.slug, name: item.venueName, zone: item.venueZone, address: item.venueAddress, description: item.venueAddress || 'Sede publicada en Cuicoyan.' } : null);
  const related = (item.artistIds?.map((id) => getArtistById(id)).filter(Boolean)) || artists.filter((artist) => artist.nextEventId === item.id);
  const labels = labelOf();
  const { date, time } = eventDateParts(item.dateLabel);
  const detailPhoto = { 'fandango-con-la-plaza': 'evento-hero' }[item.slug];
  const pictures = detailPhoto ? [el('img', { className: 'detail-img', src: asset(detailPhoto), alt: '', decoding: 'async' })] : eventPicture(item, 'detail-img');
  const favorite = el('button', { className: 'fav-action', type: 'button' });
  const paintFav = () => { const saved = isFavorite('event', item.id); favorite.replaceChildren(icon('heart', { size: 24, className: saved ? 'filled' : '' }), saved ? 'Quitar de favoritos' : 'Guardar en favoritos'); favorite.setAttribute('aria-pressed', String(saved)); };
  favorite.addEventListener('click', () => { const saved = toggleFavorite('event', item.id); paintFav(); announce(saved ? 'Evento guardado en favoritos' : 'Evento eliminado de favoritos'); });
  paintFav();
  const facts = [['calendar', 'Fecha', [date, time].filter(Boolean).join(' · ')], ['pin', 'Lugar', venue ? [venue.name, venue.zone].filter(Boolean).join(' · ') : 'Sede por confirmar'], ['clock', 'Entrada', item.priceLabel], ['users', 'Público', item.audience]];
  const hero = el('section', { className: `detail-hero${pictures.length ? '' : ' no-photo'}` }, [el('div', { className: 'detail-hero-art', attrs: { 'aria-hidden': 'true' } }, pictures), el('div', { className: 'detail-hero-copy' }, [el('span', { className: 'eyebrow', text: item.isDemo === false ? 'Evento publicado' : 'Evento demostrativo' }), el('h1', { text: item.title }), el('p', { text: item.description })])]);
  wrap('event-page', [backLink('Regresar', routes.eventos), hero,
    el('dl', { className: 'detail-facts' }, facts.map(([iconName, term, value]) => el('div', {}, [icon(iconName, { size: 26 }), el('dt', { text: term }), el('dd', { text: value })]))),
    el('section', { className: 'profile-block' }, [sectionTitle('flower', 'Sobre este encuentro'), el('p', { className: 'profile-bio', text: item.description }), el('div', { className: 'ev-tags' }, (item.categorySlugs || []).map((slug) => el('span', { className: 'ev-tag', dataset: { cat: slug }, text: labels[slug] || slug }))), el('div', { className: 'detail-actions' }, [favorite, venue ? el('a', { className: 'button secondary', href: `${routes.mapa}?foro=${venue.slug}`, text: 'Ver en mapa' }) : null])]),
    related.length ? el('section', { className: 'profile-block' }, [sectionTitle('users', 'Artistas relacionados'), el('div', { className: 'artist-list' }, related.map((artist) => el('article', { className: 'artist-row' }, [el('span', { className: 'artist-avatar' }, [avatar(artist)]), el('div', { className: 'artist-main' }, [el('h3', {}, [el('a', { href: routes.artista(artist.slug), text: artist.name })]), el('p', { className: 'artist-tags' }, [el('span', { text: artist.discipline }), el('i', { text: '•' }), el('span', { text: artist.tagline })]), el('p', { className: 'artist-bio', text: artist.bio })]), favoriteButton('artist', artist.id, artist.name)])))]) : null,
    el('section', { className: 'profile-block detail-soon' }, [el('strong', { text: 'Acciones no disponibles aún' }), el('p', { className: 'muted', text: 'Reservar, comprar, añadir al calendario y compartir se habilitarán cuando exista un canal aprobado.' }), el('button', { className: 'button', type: 'button', disabled: true, text: 'Próximamente' })]),
    isDemo(item) ? demoNote() : null]);
}

/* ----------------------------------------------------- Eventos / Foros / Explorar */
const searchField = (name, value, placeholder, label) => el('label', { className: 'app-search' }, [icon('search', { size: 24 }), el('span', { className: 'sr-only', text: label || placeholder }), el('input', { type: 'search', name, value: value || '', placeholder, autocomplete: 'off' })]);
const selectField = (name, label, options, current) => el('label', { className: 'select-pill' }, [el('span', { className: 'sr-only', text: label }), el('select', { name }, options.map(([value, text]) => el('option', { value, text, selected: value === current })))]);

export function renderEventsPage({ items, zones, categories, state, navigate, eventCard }) {
  const form = el('form', { className: 'filter-bar', attrs: { 'aria-label': 'Filtros de eventos' } }, [
    searchField('q', state.q, 'Buscar eventos'),
    selectField('date', 'Fecha', [['all', 'Cualquier fecha'], ['today', 'Hoy'], ['weekend', 'Este fin de semana'], ['month', 'Este mes']], state.date),
    selectField('zone', 'Zona', [['', 'Todas las zonas'], ...zones.map((zone) => [zone, zone])], state.zone),
    selectField('categoria', 'Categoría', [['', 'Todas las categorías'], ...categories.slice(1).map((category) => [category.slug, category.label])], state.categoria),
    el('button', { className: 'button', type: 'submit', text: 'Aplicar filtros' }),
    el('a', { className: 'button secondary', href: routes.eventos, text: 'Limpiar' }),
  ]);
  form.addEventListener('submit', (event) => { event.preventDefault(); navigate(Object.fromEntries(new FormData(form))); });
  form.querySelectorAll('select').forEach((select) => select.addEventListener('change', () => form.requestSubmit()));
  const list = el('div', { className: 'ev-list' }, items.length ? items.map(eventCard) : [el('div', { className: 'empty-state' }, [el('h3', { text: 'No encontramos eventos' }), el('p', { className: 'muted', text: 'Prueba otra combinación de filtros.' })])]);
  wrap('events-page', [pageHead('Agenda local', 'Eventos', el('span', { className: 'app-count', text: `${items.length} evento${items.length === 1 ? '' : 's'}` })), form, list, items.some(isDemo) ? demoNote('Los registros de esta agenda son demostrativos y deben verificarse antes de publicar.') : null]);
}

export function renderVenuesPage(venues) {
  const list = el('div', { className: 'venue-list', attrs: { 'aria-live': 'polite' } });
  const input = el('input', { type: 'search', name: 'q', placeholder: 'Busca foros y espacios', attrs: { 'aria-label': 'Buscar foros y espacios' } });
  const paint = () => { const query = normalizeText(input.value); const items = venues.filter((venue) => !query || normalizeText(`${venue.name} ${venue.zone} ${venue.description} ${(venue.categories || []).join(' ')}`).includes(query)); list.replaceChildren(...(items.length ? items.map(venueRow) : [el('div', { className: 'empty-state' }, [el('h3', { text: 'No encontramos espacios' }), el('p', { className: 'muted', text: 'Prueba con otra palabra.' })])])); };
  input.addEventListener('input', paint);
  wrap('venues-page', [pageHead('Espacios culturales', 'Foros', el('span', { className: 'app-count', text: `${venues.length} espacios` })), el('div', { className: 'app-search' }, [icon('search', { size: 24 }), input, el('a', { className: 'filter-button', href: routes.mapa, attrs: { 'aria-label': 'Ver en el mapa' } }, [icon('map', { size: 22 })])]), list, demoNote('Directorio local con zonas generales y puntos conceptuales por verificar.')]);
  paint();
}

export function renderExplorePage({ results, categories, state, navigate, eventCard, events }) {
  const form = el('form', { className: 'filter-bar', attrs: { role: 'search', 'aria-label': 'Buscar en Cuicoyan' } }, [searchField('q', state.q, 'Busca eventos, artistas o lugares'), el('button', { className: 'button', type: 'submit', text: 'Buscar' })]);
  form.addEventListener('submit', (event) => { event.preventDefault(); navigate({ q: form.elements.q.value, categoria: state.categoria, intencion: state.intencion }); });
  const chips = categories.map((category) => { const chip = el('button', { className: 'cat-chip', type: 'button', style: `--chip-color:var(--${category.color === 'brand' ? 'primary' : category.color})`, attrs: { 'aria-pressed': String((category.slug === 'todos' && !state.categoria) || category.slug === state.categoria) } }, [icon(category.slug === 'todos' ? 'all' : category.slug, { size: 24, className: 'cat-icon' }), el('span', { text: category.label })]); chip.addEventListener('click', () => navigate({ q: form.elements.q.value, categoria: category.slug === 'todos' ? '' : category.slug, intencion: state.intencion })); return chip; });
  const intentions = [['Cerca de ti', 'cerca'], ['Este fin de semana', 'fin-de-semana'], ['Entrada libre', 'libre'], ['Para ir en familia', 'familia'], ['Tradición', 'tradicion'], ['Escena independiente', 'independiente']].map(([label, value]) => { const chip = el('button', { className: 'intent-chip', type: 'button', text: label, attrs: { 'aria-pressed': String(state.intencion === value) } }); chip.addEventListener('click', () => navigate({ q: form.elements.q.value, categoria: state.categoria, intencion: state.intencion === value ? '' : value })); return chip; });
  const evs = results.filter((item) => item.title), arts = results.filter((item) => item.discipline), vens = results.filter((item) => !item.title && !item.discipline);
  const group = (iconName, title, items, node) => items.length ? el('section', { className: 'profile-block' }, [sectionTitle(iconName, title), node]) : null;
  const blocks = [group('calendar', 'Eventos', evs, el('div', { className: 'ev-list' }, evs.map(eventCard))), group('users', 'Artistas', arts, el('div', { className: 'artist-list' }, arts.map((artist) => artistRow(artist, events.find((event) => event.id === artist.nextEventId))))), group('pin', 'Espacios', vens, el('div', { className: 'venue-list' }, vens.map(venueRow)))].filter(Boolean);
  wrap('explore-page', [pageHead('Explora a tu manera', 'Explorar', el('span', { className: 'app-count', text: `${results.length} resultado${results.length === 1 ? '' : 's'}` })), form, el('div', { className: 'cat-row', attrs: { role: 'group', 'aria-label': 'Categorías culturales' } }, chips), el('div', { className: 'intent-row', attrs: { role: 'group', 'aria-label': 'Intenciones' } }, intentions), ...(blocks.length ? blocks : [el('div', { className: 'empty-state' }, [el('h3', { text: 'No encontramos coincidencias' }), el('p', { className: 'muted', text: 'Prueba otra palabra o limpia los filtros para ver el contenido disponible.' }), el('a', { className: 'button', href: routes.explorar, text: 'Limpiar filtros' })])]), demoNote()]);
}
