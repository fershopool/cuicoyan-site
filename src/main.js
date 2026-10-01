import { el, $, announce } from './utils/dom.js';
import { routeForPath, routes, withBase } from './config/routes.js';
import { readUrlState, goWithState } from './utils/url-state.js';
import { getEvents, getArtists, getVenues, getCategories, getEvent, getArtist, getVenue, getVenueById, getCalls, getHelp, loadRemoteEvents, loadRemoteEvent, loadRemoteSpaces } from './services/content.service.js';
import { searchItems } from './services/search.service.js';
import { getFavorites, isFavorite, toggleFavorite } from './services/favorites.service.js';
import { getPreferences, savePreferences, clearPreferences } from './services/preferences.service.js';
import { getJoinChannel, getContactChannel } from './services/external-channel.service.js';
import { renderShell, renderFooter } from './components/shell.js';
import { eventCard, artistCard, venueCard, eventImageUrl } from './components/cards.js';
import { mapView } from './components/map.js';
import { apiRequest, clearSession, consumeAuthRedirect, invitationId, setPassword } from './services/auth.service.js';

consumeAuthRedirect();

const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = new URL('./styles/app.css', import.meta.url);
document.head.append(stylesheet);

let events = getEvents();
const artists = getArtists();
let venues = getVenues();
const categories = getCategories();

function pageFrame({ eyebrow, title, description, children, className = '' }) {
  const main = el('main', { id: 'contenido' }, [el('section', { className: `page-hero ${className}` }, [el('div', { className: 'container page-hero-inner' }, [el('span', { className: 'eyebrow', text: eyebrow }), el('h1', { text: title }), description ? el('p', { className: 'muted', text: description }) : null])]), ...children]);
  $('#app').replaceWith(main);
  return main;
}

function sectionHeading(eyebrow, title, description) { return el('div', { className: 'section-heading' }, [eyebrow ? el('span', { className: 'eyebrow', text: eyebrow }) : null, el('h2', { text: title }), description ? el('p', { text: description }) : null]); }
function section(className, children) { return el('section', { className: `section ${className || ''}` }, [el('div', { className: 'container' }, children)]); }
function linkButton(label, href, secondary = false) { return el('a', { className: `button${secondary ? ' secondary' : ''}`, href, text: label }); }
function demoNotice(text = 'Los registros con esta etiqueta son demostrativos y deben verificarse antes de publicar.') { return el('p', { className: 'notice', text }); }

function renderHome() {
  const search = el('form', { className: 'search-box', attrs: { role: 'search' } }, [el('label', { className: 'sr-only', htmlFor: 'home-search', text: 'Buscar en Cuicoyan' }), el('input', { id: 'home-search', name: 'q', type: 'search', placeholder: 'Busca eventos, artistas o lugares', autocomplete: 'off' }), el('button', { className: 'button', type: 'submit', text: 'Buscar' })]);
  search.addEventListener('submit', (event) => { event.preventDefault(); goWithState(routes.explorar, { q: $('#home-search', search).value }); });
  const heroTitle = el('h1', {}, ['Descubre la cultura que está pasando', el('span', { className: 'hero-emphasis', text: ' cerca de ti.' })]);
  const hero = el('section', { className: 'hero' }, [el('div', { className: 'container hero-grid' }, [el('div', { className: 'hero-copy' }, [el('span', { className: 'eyebrow', text: 'Cultura viva en CDMX' }), heroTitle, el('p', { text: 'Eventos, artistas, foros y experiencias culturales de CDMX, reunidos para que encuentres tu próximo plan.' }), search, el('div', { className: 'hero-actions' }, [linkButton('Explorar Cuicoyan', routes.explorar), linkButton('Soy artista o foro', '#para-creadores', true)]), el('p', { className: 'muted', text: 'Donde la ciudad encuentra su escenario.' }), el('div', { className: 'quick-links', attrs: { 'aria-label': 'Accesos rápidos' } }, [['Cerca de ti','cerca'],['Este fin de semana','fin-de-semana'],['Gratis','libre'],['Para ir en familia','familia']].map(([label, value]) => el('a', { className: 'chip', href: `${routes.explorar}?intencion=${value}`, text: label }))) ]), el('div', { className: 'hero-art' }, [el('div', { className: 'hero-art-card' }, [el('img', { className: 'hero-art-image', src: withBase('/src/assets/cuicoyan/hero-cdmx.webp'), alt: 'Collage editorial de CDMX con Bellas Artes, flores, textiles y un instrumento de cuerda.', fetchpriority: 'high' }), el('span', { className: 'hero-art-word', text: 'CULTURA VIVA · CDMX', attrs: { 'aria-hidden': 'true' } })])])])]);
  const categoryRow = el('div', { className: 'category-row home-category-row' }, categories.map((category) => el('a', { className: 'category-chip', href: category.slug === 'todos' ? routes.explorar : `${routes.explorar}?categoria=${category.slug}`, style: `--chip-color:var(--${category.color === 'brand' ? 'primary' : category.color})` }, [el('span', { text: category.icon, attrs: { 'aria-hidden': 'true' } }), el('span', { text: category.label })])));
  const categorySection = section('alt', [sectionHeading('Explora a tu manera', '¿Qué te gustaría vivir?', 'Empieza por lo que te mueve. Puedes cambiar de categoría, fecha o zona en cualquier momento.'), categoryRow, el('div', { className: 'intentions' }, [['Cerca de ti','cerca'],['Este fin de semana','fin-de-semana'],['Entrada libre','libre'],['Para ir en familia','familia'],['Tradición','tradicion'],['Escena independiente','independiente']].map(([label,value]) => el('a', { className: 'chip', href: `${routes.explorar}?intencion=${value}`, text: label }))), el('p', { style: 'margin-top:1rem' }, [el('a', { className: 'button ghost', href: `${routes.explorar}#categorias`, text: 'Ver todas las categorías →' })])]);
  const eventsSection = section('', [sectionHeading('Agenda local', 'Planes para encontrarte con la ciudad.', 'Explora una selección de música, danza, teatro y encuentros que están por suceder.'), demoNotice(), el('div', { className: 'cards event-grid' }, events.slice(0, 3).map(eventCard)), el('div', { style: 'margin-top:1.4rem' }, [linkButton('Ver todos los eventos', routes.eventos, true)])]);
  const map = mapView(venues.slice(0, 4));
  const mapSection = section('paper', [sectionHeading('Mapa cultural', 'La cultura también se descubre caminando.', 'Ubica foros, eventos y espacios culturales por zona. Empieza en CDMX y acerca el mapa a tu barrio.'), el('div', { className: 'map-layout' }, [el('div', { className: 'prose' }, [el('span', { className: 'badge', text: 'CDMX · vista conceptual' }), el('h3', { text: 'Espacios para comenzar' }), map.list, linkButton('Abrir mapa cultural', routes.mapa)]), map.map])]);
  const artistsSection = section('', [sectionHeading('Personas y colectivos', 'Artistas que están creando.', 'Conoce las voces, cuerpos, ideas y proyectos que mantienen en movimiento la cultura de la ciudad.'), demoNotice(), el('div', { className: 'grid grid-4' }, artists.map(artistCard)), el('div', { style: 'margin-top:1.4rem' }, [linkButton('Conocer artistas', routes.artistas, true)])]);
  const venuesSection = section('alt', [sectionHeading('Espacios culturales', 'Foros que hacen ciudad.', 'Encuentra escenarios, centros culturales y espacios independientes; conoce su programación y cómo llegar.'), demoNotice(), el('div', { className: 'cards' }, venues.slice(0, 3).map(venueCard)), el('div', { style: 'margin-top:1.4rem' }, [linkButton('Explorar foros', routes.foros, true)])]);
  const benefitCard = (label, title, copy, bullets, href, cta) => el('article', { className: 'benefit' }, [el('span', { className: 'badge', text: label }), el('h3', { text: title }), el('p', { className: 'muted', text: copy }), el('ul', {}, bullets.map((item) => el('li', { text: item }))), linkButton(cta, href, true)]);
  const benefitsSection = section('', [
    sectionHeading('Para quienes hacen cultura', 'Cuicoyan también es un lugar para tu proyecto.', 'Construye una presencia clara, conecta tu programación con nuevos públicos y forma parte del mapa cultural de la ciudad.'),
    el('div', { id: 'para-creadores', className: 'benefit-grid' }, [
      benefitCard('Artistas y colectivos', 'Haz resonar tu trabajo', 'Reúne tu perfil, disciplinas, publicaciones y próximas fechas para que el público descubra tu trabajo en contexto.', ['Perfil cultural propio', 'Fechas conectadas con eventos y foros', 'Mayor facilidad para que te encuentren'], `${routes.unete}?rol=artista`, 'Quiero registrar mi proyecto'),
      benefitCard('Foros y espacios', 'Muestra dónde ocurre', 'Presenta tu espacio, zona y programación en un lugar diseñado para conectar con públicos diversos.', ['Ficha clara del espacio', 'Programación relacionada', 'Presencia en el mapa cultural'], `${routes.unete}?rol=foro`, 'Quiero sumar mi espacio'),
    ]),
  ]);
  const purposeSection = section('paper', [sectionHeading('El lugar del canto', 'Una ciudad se reconoce en lo que comparte.', 'Cuicoyan reúne las historias, encuentros y escenarios que hacen visible la cultura cotidiana de CDMX. La exploración empieza en un evento, una voz o un lugar; la comunidad hace el resto.')]);
  const finalSection = section('', [el('div', { className: 'final-cta' }, [el('div', { className: 'prose' }, [el('span', { className: 'eyebrow', style: 'color:#fff', text: 'Súmate a la escena' }), el('h2', { text: 'Encuentra tu próximo escenario.' }), el('p', { text: 'Explora contenidos demostrativos hoy y ayúdanos a construir una agenda cultural clara, cercana y viva.' })]), linkButton('Explorar Cuicoyan', routes.explorar)])]);
  $('#app').replaceWith(el('main', { id: 'contenido' }, [hero, categorySection, eventsSection, mapSection, artistsSection, venuesSection, benefitsSection, purposeSection, finalSection]));
}

function renderExplore() {
  const state = readUrlState(); const results = searchItems([...events, ...artists, ...venues], state); const form = el('form', { className: 'filter-form', attrs: { 'aria-label': 'Filtros de exploración' } }, [el('label', { className: 'sr-only', htmlFor: 'explore-q', text: 'Buscar' }), el('input', { id: 'explore-q', name: 'q', type: 'search', value: state.q, placeholder: 'Buscar por palabra' }), el('label', { className: 'sr-only', htmlFor: 'explore-category', text: 'Categoría' }), el('select', { id: 'explore-category', name: 'categoria' }, [el('option', { value: '', text: 'Todas las categorías' }), ...categories.slice(1).map((c) => el('option', { value: c.slug, text: c.label, selected: c.slug === state.categoria }))]), el('button', { className: 'button', type: 'submit', text: 'Aplicar filtros' }), el('a', { className: 'button secondary', href: routes.explorar, text: 'Limpiar' })]);
  form.addEventListener('submit', (event) => { event.preventDefault(); goWithState(routes.explorar, { q: $('#explore-q', form).value, categoria: $('#explore-category', form).value, intencion: state.intencion }); });
  const resultCards = results.map((item) => item.title ? eventCard(item) : item.discipline ? artistCard(item) : venueCard(item));
  const main = pageFrame({ eyebrow: 'Explora a tu manera', title: 'Encuentra algo que te mueva.', description: 'Combina una palabra con una categoría. Todo lo que ves en esta entrega está marcado como demostración.', children: [section('', [el('div', { className: 'toolbar' }, [form, el('span', { className: 'muted', text: `${results.length} resultado${results.length === 1 ? '' : 's'}` })]), el('div', { className: 'grid grid-3' }, resultCards.length ? resultCards : [el('div', { className: 'empty-state' }, [el('h2', { text: 'No encontramos coincidencias' }), el('p', { className: 'muted', text: 'Prueba otra palabra o limpia los filtros para ver el contenido disponible.' }), el('a', { className: 'button', href: routes.explorar, text: 'Ver todo' })])])]) ] });
  return main;
}

function eventMatchesState(event, state) {
  const query = state.q.toLowerCase().trim();
  const searchable = `${event.title || ''} ${event.description || ''} ${event.venueName || ''} ${event.venueZone || ''} ${(event.categorySlugs || []).join(' ')}`.toLowerCase();
  if (query && !searchable.includes(query)) return false;
  if (state.zone && event.venueZone !== state.zone) return false;
  if (state.categoria && !(event.categorySlugs || []).includes(state.categoria)) return false;
  if (state.date !== 'all' && event.startsAt) {
    const startsAt = new Date(event.startsAt);
    const today = new Date();
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(day);
    if (state.date === 'today') end.setDate(end.getDate() + 1);
    if (state.date === 'weekend') { day.setDate(day.getDate() + (6 - day.getDay() + 7) % 7); end.setTime(day.getTime()); end.setDate(end.getDate() + 2); }
    if (state.date === 'month') { day.setDate(1); end.setMonth(end.getMonth() + 1); }
    if (startsAt < day || startsAt >= end) return false;
  }
  return true;
}

function renderEvents() {
  const state = { date: 'all', zone: '', categoria: '', ...readUrlState() };
  const zones = [...new Set(venues.map((venue) => venue.zone).filter(Boolean))];
  const form = el('form', { className: 'filter-form', attrs: { 'aria-label': 'Filtros de eventos' } }, [
    el('input', { name: 'q', type: 'search', value: state.q, placeholder: 'Buscar eventos', attrs: { 'aria-label': 'Buscar eventos' } }),
    el('select', { name: 'date', attrs: { 'aria-label': 'Fecha' } }, [['all', 'Cualquier fecha'], ['today', 'Hoy'], ['weekend', 'Este fin de semana'], ['month', 'Este mes']].map(([value, text]) => el('option', { value, text, selected: value === state.date }))),
    el('select', { name: 'zone', attrs: { 'aria-label': 'Zona' } }, [el('option', { value: '', text: 'Todas las zonas' }), ...zones.map((zone) => el('option', { value: zone, text: zone, selected: zone === state.zone }))]),
    el('select', { name: 'categoria', attrs: { 'aria-label': 'Categoría' } }, [el('option', { value: '', text: 'Todas las categorías' }), ...categories.slice(1).map((category) => el('option', { value: category.slug, text: category.label, selected: category.slug === state.categoria }))]),
    el('button', { className: 'button', type: 'submit', text: 'Aplicar filtros' }),
    el('a', { className: 'button secondary', href: routes.eventos, text: 'Limpiar' }),
  ]);
  form.addEventListener('submit', (event) => { event.preventDefault(); goWithState(routes.eventos, Object.fromEntries(new FormData(form))); });
  const items = events.filter((item) => eventMatchesState(item, state));
  return pageFrame({ eyebrow: 'Agenda local', title: 'Eventos culturales en CDMX.', description: 'Explora eventos publicados y contenido local disponible cuando la API no responde.', children: [section('', [el('div', { className: 'toolbar' }, [form, el('span', { className: 'muted', text: `${items.length} evento${items.length === 1 ? '' : 's'}` })]), items.some((item) => item.isDemo !== false) ? demoNotice() : null, el('div', { className: 'grid grid-3' }, items.length ? items.map(eventCard) : [el('div', { className: 'empty-state' }, [el('h2', { text: 'No encontramos eventos' }), el('p', { className: 'muted', text: 'Prueba otra combinación de filtros.' })])])]) ] });
}
function renderArtists() { return renderListing('artistas', 'Personas y colectivos', 'Artistas que están creando.', 'Directorio local de perfiles demostrativos, sin cuentas ni seguimiento remoto.', artists, artistCard); }
function renderVenues() { return renderListing('foros', 'Espacios culturales', 'Foros que hacen ciudad.', 'Directorio local con zonas generales y puntos conceptuales por verificar.', venues, venueCard); }
function renderListing(kind, eyebrow, title, description, items, card) { const input = el('input', { type: 'search', name: 'q', placeholder: `Buscar ${kind}`, attrs: { 'aria-label': `Buscar ${kind}` } }); const grid = el('div', { className: 'grid grid-3' }, items.map(card)); input.addEventListener('input', () => { const query = input.value.toLowerCase().trim(); grid.replaceChildren(...items.filter((item) => (item.title || item.name).toLowerCase().includes(query)).map(card)); }); return pageFrame({ eyebrow, title, description, children: [section('', [el('div', { className: 'toolbar' }, [input, el('a', { className: 'button secondary', href: routes.explorar, text: 'Explorar todo' })]), demoNotice(), grid]) ] }); }

function renderDetail(type) { const segments = window.location.pathname.split('/').filter(Boolean); const slug = segments.at(-1); const item = type === 'event' ? getEvent(slug) : type === 'artist' ? getArtist(slug) : getVenue(slug); if (!item) { if (type === 'event') { pageFrame({ eyebrow: 'Evento', title: 'Cargando evento…', description: '', children: [] }); void loadRemoteEvent(slug).then((remote) => { if (!window.location.pathname.endsWith(`/${slug}`)) return; remote ? renderCurrentRoute() : renderNotFound(); }); return; } return renderNotFound(); } if (type === 'event') { const venue = item.venue || getVenueById(item.venueId) || (item.venueName ? { id: item.venueId, slug: item.venueId || slug, name: item.venueName, zone: item.venueZone, address: item.venueAddress, description: item.venueAddress || 'Sede publicada en Cuicoyan.', categories: [], isDemo: false } : null); const related = item.artistIds?.map((id) => artists.find((a) => a.id === id)).filter(Boolean) || artists.filter((a) => a.nextEventId === item.id); return pageFrame({ eyebrow: item.isDemo === false ? 'Evento publicado' : 'Evento demostrativo', title: item.title, description: item.description, children: [section('', [el('div', { className: 'detail-grid event-detail' }, [el('div', { className: 'prose' }, [el('div', { className: 'detail-cover' }, [el('img', { src: eventImageUrl(item), alt: `Imagen de ${item.title}`, fetchpriority: 'high' })]), item.isDemo === false ? null : demoNotice(), el('h2', { text: 'Sobre este encuentro' }), el('p', { text: item.description }), el('div', { className: 'detail-panel' }, [el('strong', { text: `◷ ${item.dateLabel}` }), el('span', { text: `⌖ ${venue?.name || 'Sede por confirmar'} · ${venue?.zone || 'CDMX'}` }), venue?.address ? el('span', { text: `⌖ ${venue.address}` }) : null, el('span', { text: `Entrada: ${item.priceLabel}` }), el('span', { text: `Público: ${item.audience}` })]), el('div', { className: 'category-row' }, item.categorySlugs.map((c) => el('span', { className: 'badge', text: c }))), el('button', { className: 'button secondary', type: 'button', text: isFavorite('event', item.id) ? '♥ Quitar de favoritos' : '♡ Guardar en favoritos' , onClick: () => { const saved = toggleFavorite('event', item.id); announce(saved ? 'Evento guardado en favoritos' : 'Evento eliminado de favoritos'); } })]), el('aside', { className: 'detail-aside' }, [venue ? venueCard(venue) : null, el('div', { className: 'detail-panel' }, [el('strong', { text: 'Acciones no disponibles aún' }), el('p', { className: 'muted', text: 'Reservar, comprar, añadir al calendario y compartir se habilitarán cuando exista un canal aprobado.' }), el('button', { className: 'button', type: 'button', disabled: true, text: 'Próximamente' })])])]), related.length ? el('div', { style: 'margin-top:3rem' }, [sectionHeading('Conexiones', 'Artistas relacionados', ''), el('div', { className: 'grid grid-4' }, related.map(artistCard))]) : null]) ] }); }
  if (type === 'artist') return pageFrame({ eyebrow: 'Perfil demostrativo', title: item.name, description: item.bio, children: [section('', [demoNotice(), el('div', { className: 'detail-grid' }, [el('div', { className: 'prose' }, [el('span', { className: 'badge', text: `${item.discipline} · ${item.tagline}` }), el('h2', { text: 'Una ficha para conectar trabajo y agenda.' }), el('p', { text: item.bio }), el('a', { className: 'button', href: routes.evento(getEvent(item.nextEventId)?.slug || 'sones-del-barrio'), text: `Ver próxima fecha: ${getEvent(item.nextEventId)?.title || 'por confirmar'}` })]), el('aside', { className: 'detail-aside' }, [artistCard(item), el('div', { className: 'detail-panel' }, [el('strong', { text: 'Datos pendientes de verificación' }), el('p', { className: 'muted', text: 'No se muestran biografía extensa, contacto, redes ni métricas hasta contar con autorización.' })])])])]) ] });
  return pageFrame({ eyebrow: 'Espacio demostrativo', title: item.name, description: item.description, children: [section('', [demoNotice(), el('div', { className: 'detail-grid' }, [el('div', { className: 'prose' }, [el('span', { className: 'badge', text: `${item.zone} · ${item.categories.join(' · ')}` }), el('h2', { text: 'Un escenario conectado con su comunidad.' }), el('p', { text: item.description }), el('a', { className: 'button', href: `${routes.mapa}?foro=${item.slug}`, text: 'Ver en mapa cultural' })]), el('aside', { className: 'detail-aside' }, [venueCard(item), el('div', { className: 'detail-panel' }, [el('strong', { text: 'Información por confirmar' }), el('p', { className: 'muted', text: 'Horarios, dirección exacta, accesibilidad y contacto requieren una fuente aprobada.' })])])])]) ] });
}

function renderMap() { const map = mapView(venues); return pageFrame({ eyebrow: 'Mapa cultural', title: 'La cultura también se descubre caminando.', description: 'Vista conceptual de CDMX con una lista equivalente. No usa geolocalización ni mapas externos.', children: [section('', [el('div', { className: 'map-layout' }, [el('div', { className: 'prose' }, [el('span', { className: 'badge', text: 'CDMX · puntos conceptuales' }), el('h2', { text: 'Espacios para comenzar' }), map.list, el('p', { className: 'muted', text: 'Cada punto está pendiente de verificación geográfica.' })]), map.map])]) ] }); }

function renderFavorites() { const favorites = getFavorites(); const items = favorites.map(({ type, id }) => type === 'event' ? events.find((x) => x.id === id) : type === 'artist' ? artists.find((x) => x.id === id) : venues.find((x) => x.id === id)).filter(Boolean); const clear = el('button', { className: 'button secondary', type: 'button', text: 'Borrar favoritos' }); clear.addEventListener('click', () => { items.forEach((item) => toggleFavorite(item.title ? 'event' : item.discipline ? 'artist' : 'venue', item.id)); window.location.reload(); }); return pageFrame({ eyebrow: 'Mi Cuicoyan', title: 'Tus favoritos, solo en este navegador.', description: 'No necesitas una cuenta. Nada se sincroniza con un servidor.', children: [section('', [items.length ? el('div', { className: 'toolbar' }, [el('span', { className: 'muted', text: `${items.length} guardado${items.length === 1 ? '' : 's'}` }), clear]) : null, items.length ? el('div', { className: 'grid grid-3' }, items.map((item) => item.title ? eventCard(item) : item.discipline ? artistCard(item) : venueCard(item))) : el('div', { className: 'empty-state' }, [el('h2', { text: 'Aún no guardas nada' }), el('p', { className: 'muted', text: 'Explora eventos, artistas y foros y usa el corazón para volver después.' }), el('a', { className: 'button', href: routes.explorar, text: 'Explorar Cuicoyan' })])]) ] }); }

function renderOnboarding() { const selected = new Set(getPreferences().interests); const form = el('form', { className: 'onboarding' }, [el('span', { className: 'eyebrow', text: 'Preferencias locales' }), el('h1', { text: '¿Qué te gustaría vivir?' }), el('p', { className: 'muted', text: 'Elige intereses para preparar tu exploración. No pedimos correo ni creamos una cuenta.' }), el('div', { className: 'interest-grid' }, categories.slice(1).map((category) => el('label', {}, [el('input', { type: 'checkbox', name: 'interest', value: category.slug, checked: selected.has(category.slug) }), el('span', { text: category.label })]))), el('div', { className: 'hero-actions' }, [el('button', { className: 'button', type: 'submit', text: 'Guardar intereses' }), el('a', { className: 'button secondary', href: routes.explorar, text: 'Omitir' })]), el('button', { className: 'button ghost', type: 'button', text: 'Borrar datos locales' })]); form.addEventListener('submit', (event) => { event.preventDefault(); savePreferences({ interests: [...form.querySelectorAll('input:checked')].map((input) => input.value) }); announce('Intereses guardados en este navegador'); window.location.href = routes.explorar; }); form.querySelector('.button.ghost').addEventListener('click', () => { clearPreferences(); announce('Datos locales borrados'); form.reset(); }); $('#app').replaceWith(el('main', { id: 'contenido' }, [form])); }

function renderCreators() { return pageFrame({ eyebrow: 'Para quienes hacen cultura', title: 'Tu proyecto también encuentra su escenario.', description: 'Una explicación del espacio de participación, sin promesas de alcance, comisión o resultados garantizados.', children: [section('', [el('div', { className: 'benefit-grid' }, [el('article', { className: 'benefit' }, [el('h2', { text: 'Artistas y colectivos' }), el('p', { text: 'Una presencia clara para reunir disciplinas, publicaciones y próximas fechas.' }), el('ul', {}, ['Perfil cultural propio','Eventos y foros relacionados','Información editable cuando exista un canal aprobado'].map((x) => el('li', { text: x }))), el('a', { className: 'button', href: `${routes.unete}?rol=artista`, text: 'Quiero registrar mi proyecto' })]), el('article', { className: 'benefit' }, [el('h2', { text: 'Foros y espacios' }), el('p', { text: 'Una ficha para mostrar qué sucede en tu espacio y cómo se conecta con la ciudad.' }), el('ul', {}, ['Ficha del espacio','Presencia en el mapa conceptual','Programación relacionada'].map((x) => el('li', { text: x }))), el('a', { className: 'button', href: `${routes.unete}?rol=foro`, text: 'Quiero sumar mi espacio' })])]), demoNotice()]) ] }); }
function renderJoin() { const role = new URLSearchParams(window.location.search).get('rol'); const channel = getJoinChannel(); return pageFrame({ eyebrow: 'Participa', title: role === 'foro' ? 'Suma tu espacio a Cuicoyan.' : role === 'artista' ? 'Haz resonar tu proyecto.' : 'Únete a Cuicoyan.', description: 'Esta versión no crea cuentas, no recibe archivos y no almacena datos.', children: [section('', [el('div', { className: 'prose' }, [demoNotice('El registro está pendiente de un canal externo aprobado. No introduzcas información personal aquí.'), channel ? el('a', { className: 'button', href: channel, target: '_blank', rel: 'noopener noreferrer', text: 'Continuar en canal externo' }) : el('button', { className: 'button', type: 'button', disabled: true, text: 'Canal próximamente' }), el('a', { className: 'button secondary', href: routes.creadores, text: 'Conocer cómo funciona' })])]) ] }); }
function renderInvitation() {
  const state = el('div', { id: 'invitation-state', className: 'detail-panel' }, [el('p', { className: 'muted', text: 'Validando invitación…' })]);
  const main = pageFrame({ eyebrow: 'Invitación privada', title: 'Activa tu acceso a Cuicoyan.', description: 'Usa una contraseña para terminar la invitación y después completa únicamente los datos de tu perfil.', children: [section('', [state])] });
  const id = invitationId();
  if (!id) { state.replaceChildren(el('p', { className: 'notice', text: 'La invitación no incluye un identificador válido.' })); return main; }
  const form = el('form', { className: 'account-form' }, [
    el('label', { text: 'Nueva contraseña', attrs: { for: 'invite-password' } }),
    el('input', { id: 'invite-password', name: 'password', type: 'password', minlength: '8', required: true, autocomplete: 'new-password' }),
    el('label', { text: 'Repite la contraseña', attrs: { for: 'invite-password-confirm' } }),
    el('input', { id: 'invite-password-confirm', name: 'password_confirm', type: 'password', minlength: '8', required: true, autocomplete: 'new-password' }),
    el('p', { id: 'invitation-error', className: 'form-error', attrs: { role: 'alert' } }),
    el('button', { className: 'button', type: 'submit', text: 'Aceptar invitación' })
  ]);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = $('#invitation-error', form);
    error.textContent = '';
    const password = form.password.value;
    if (password !== form.password_confirm.value) { error.textContent = 'Las contraseñas no coinciden.'; return; }
    form.querySelector('button').disabled = true;
    try {
      await setPassword(password);
      await apiRequest('/api/cuicoyan/me/invitations/accept', { method: 'POST', body: JSON.stringify({ invitation_id: id }) });
      window.location.href = routes.perfil;
    } catch (requestError) {
      error.textContent = requestError.message || 'No se pudo aceptar la invitación.';
      form.querySelector('button').disabled = false;
    }
  });
  state.replaceChildren(form);
  return main;
}
function renderProfile() {
  const statusLabels = { draft: 'Borrador', pending_review: 'En revisión', published: 'Publicado', rejected: 'Rechazado', suspended: 'Suspendido' };
  const state = el('div', { id: 'profile-state', className: 'detail-panel' }, [el('p', { className: 'muted', text: 'Cargando tu perfil…' })]);
  const main = pageFrame({ eyebrow: 'Mi perfil', title: 'Edita tu ficha cultural.', description: 'Solo puedes editar los campos editoriales de los perfiles vinculados a tu cuenta.', children: [section('', [state])] });
  void apiRequest('/api/cuicoyan/me/profile').then((body) => {
    const profile = body?.data?.profiles?.[0];
    if (!profile) { state.replaceChildren(el('p', { className: 'notice', text: 'No hay un perfil activo para esta cuenta.' })); return; }
    const locked = profile.status === 'suspended';
    const form = el('form', { className: 'account-form' }, [
      el('span', { className: 'badge', text: profile.profile_type === 'cultural_forum' ? 'Foro cultural' : 'Artista' }),
      el('p', { className: 'muted', text: `Estado: ${statusLabels[profile.status] || profile.status}` }),
      el('label', { text: 'Nombre público', attrs: { for: 'profile-name' } }),
      el('input', { id: 'profile-name', name: 'display_name', value: profile.display_name, maxlength: '160', required: true, disabled: locked }),
      el('label', { text: 'Descripción', attrs: { for: 'profile-description' } }),
      el('textarea', { id: 'profile-description', name: 'description', maxlength: '5000', rows: '7', disabled: locked }, [profile.description || '']),
      el('label', { text: 'Sitio web', attrs: { for: 'profile-website' } }),
      el('input', { id: 'profile-website', name: 'website_url', type: 'url', value: profile.website_url || '', maxlength: '500', disabled: locked }),
      el('label', { text: 'Correo de contacto público', attrs: { for: 'profile-email' } }),
      el('input', { id: 'profile-email', name: 'contact_email', type: 'email', value: profile.contact_email || '', maxlength: '320', disabled: locked }),
      el('p', { id: 'profile-error', className: 'form-error', attrs: { role: 'alert' } }),
      el('div', { className: 'hero-actions' }, [el('button', { className: 'button', type: 'submit', text: 'Guardar cambios', disabled: locked }), !locked && (profile.status === 'draft' || profile.status === 'rejected') ? el('button', { className: 'button secondary', id: 'submit-review', type: 'button', text: 'Enviar a revisión' }) : null]),
      el('button', { className: 'button ghost', id: 'profile-logout', type: 'button', text: 'Cerrar sesión en este navegador' })
    ]);
    const error = $('#profile-error', form);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); error.textContent = '';
      try { await apiRequest('/api/cuicoyan/me/profile', { method: 'PATCH', body: JSON.stringify({ profile_id: profile.id, display_name: form.display_name.value, description: form.description.value, website_url: form.website_url.value, contact_email: form.contact_email.value }) }); announce('Perfil guardado'); }
      catch (requestError) { error.textContent = requestError.message || 'No se pudo guardar el perfil.'; }
    });
    $('#submit-review', form)?.addEventListener('click', async () => {
      error.textContent = '';
      try { await apiRequest('/api/cuicoyan/me/profile/submit', { method: 'POST', body: JSON.stringify({ profile_id: profile.id }) }); announce('Perfil enviado a revisión'); renderProfile(); }
      catch (requestError) { error.textContent = requestError.message || 'No se pudo enviar el perfil.'; }
    });
    $('#profile-logout', form).addEventListener('click', () => { clearSession(); window.location.href = routes.home; });
    state.replaceChildren(form);
  }).catch((error) => state.replaceChildren(el('p', { className: 'notice', text: error.message || 'Inicia sesión desde una invitación válida.' })));
  return main;
}
function renderCalls() { const calls = getCalls(); return pageFrame({ eyebrow: 'Oportunidades', title: 'Convocatorias culturales.', description: 'Una lista de ejemplo preparada para recibir información verificada.', children: [section('', [demoNotice(), el('div', { className: 'grid grid-3' }, calls.map((call) => el('article', { className: 'detail-panel' }, [el('span', { className: 'demo-label', text: 'Demostración' }), el('h3', { text: call.title }), el('p', { className: 'muted', text: call.description }), el('strong', { text: call.status }), el('button', { className: 'button secondary', type: 'button', disabled: true, text: 'Postulación próximamente' })])))]) ] }); }
function renderInfo(kind) { const content = { sobre: ['Sobre Cuicoyan', 'Una plataforma cultural para descubrir, conectar y compartir la vida cultural de CDMX.', 'Cuicoyan reúne eventos, artistas, foros y territorio en una experiencia de exploración clara. Esta entrega es un staging estático: no representa una operación activa ni afirma alianzas, cifras o infraestructura.'], ayuda: ['Centro de ayuda', 'Respuestas breves para recorrer el prototipo.', ''], accesibilidad: ['Accesibilidad', 'El sitio está construido con la accesibilidad como criterio de diseño.', 'Trabajamos para ofrecer navegación por teclado, foco visible, contraste AA, alternativa textual del mapa y respeto a reduced motion. El canal para reportar barreras queda pendiente de configuración.'], privacidad: ['Aviso de privacidad', 'Documento de staging pendiente de validación legal.', 'Esta versión no crea cuentas, no pide correo y no incorpora analítica. Tema, intereses y favoritos se guardan localmente en tu navegador y puedes borrarlos desde onboarding. Antes de publicar se requiere responsable, versión y texto legal aprobado.'], terminos: ['Términos y convivencia', 'Texto de staging pendiente de aprobación.', 'El contenido demostrativo no constituye una cartelera, promesa de disponibilidad ni contrato de compra. No hay pagos, reservas, boletos, cuentas ni publicaciones remotas en esta entrega.'] }; const [title, desc, body] = content[kind]; const children = [section('', [kind === 'ayuda' ? el('div', { className: 'faq' }, getHelp().map((item) => el('details', {}, [el('summary', { text: item.question }), el('p', { text: item.answer })]))) : el('div', { className: 'prose' }, [demoNotice(), el('p', { text: body }), kind === 'privacidad' || kind === 'terminos' ? el('p', { className: 'muted', text: 'Versión de staging · sin publicación legal definitiva.' }) : null])])]; return pageFrame({ eyebrow: kind === 'sobre' ? 'El lugar del canto' : 'Información', title, description: desc, children }); }
function renderNotFound() { return pageFrame({ eyebrow: '404', title: 'Esta ruta no está disponible.', description: 'Regresa a Cuicoyan para continuar explorando.', children: [section('', [el('a', { className: 'button', href: routes.home, text: 'Volver al inicio' })]) ] }); }

function renderCurrentRoute() {
  const route = routeForPath();
  renderShell(route);
  switch (route) {
    case 'home': renderHome(); break; case 'explorar': renderExplore(); break; case 'eventos': renderEvents(); break; case 'evento-detalle': renderDetail('event'); break; case 'artistas': renderArtists(); break; case 'artista-detalle': renderDetail('artist'); break; case 'foros': renderVenues(); break; case 'foro-detalle': renderDetail('venue'); break; case 'mapa': renderMap(); break; case 'favoritos': renderFavorites(); break; case 'onboarding': renderOnboarding(); break; case 'creadores': renderCreators(); break; case 'unete': renderJoin(); break; case 'invitacion': renderInvitation(); break; case 'perfil': renderProfile(); break; case 'convocatorias': renderCalls(); break; case 'sobre': renderInfo('sobre'); break; case 'ayuda': renderInfo('ayuda'); break; case 'accesibilidad': renderInfo('accesibilidad'); break; case 'privacidad': renderInfo('privacidad'); break; case 'terminos': renderInfo('terminos'); break; default: renderNotFound();
  }
  renderFooter();
}

renderCurrentRoute();
void loadRemoteEvents().then((remoteEvents) => {
  if (!remoteEvents) return;
  events = remoteEvents;
  renderCurrentRoute();
}).catch(() => {
  // Fixtures remain visible when API is unavailable.
});
void loadRemoteSpaces().then((remoteSpaces) => {
  if (!remoteSpaces) return;
  venues = remoteSpaces;
  renderCurrentRoute();
}).catch(() => {
  // Venue fixtures remain visible when API is unavailable.
});
