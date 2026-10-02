import { el, $, announce } from './utils/dom.js';
import { routeForPath, routes, withBase } from './config/routes.js';
import { readUrlState, goWithState } from './utils/url-state.js';
import { getEvents, getArtists, getVenues, getCategories, getEvent, getArtist, getVenue, getVenueById, getCalls, getHelp, loadRemoteEvents, loadRemoteEvent, loadRemoteSpaces } from './services/content.service.js';
import { searchItems } from './services/search.service.js';
import { getFavorites, isFavorite, toggleFavorite } from './services/favorites.service.js';
import { getPreferences, savePreferences, clearPreferences } from './services/preferences.service.js';
import { renderShell, renderFooter } from './components/shell.js';
import { eventCard, artistCard, venueCard, eventImageUrl } from './components/cards.js';
import { icon, emblem } from './components/icons.js';
import { mapView } from './components/map.js';
import { renderArtistsPage, renderFavoritesPage, renderMapPage, renderArtistProfile, renderVenueProfile, renderEventDetail, renderEventsPage, renderVenuesPage, renderExplorePage, mapBlock } from './components/app-pages.js';
import { joinForm } from './components/join-form.js';
import { apiRequest, clearSession, consumeAuthRedirect, invitationId, setPassword } from './services/auth.service.js';

consumeAuthRedirect();

const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = new URL('./styles/app.css', import.meta.url);
document.head.append(stylesheet);
const mockupStyles = document.createElement('link');
mockupStyles.rel = 'stylesheet';
mockupStyles.href = new URL('./styles/mockup.css', import.meta.url);
document.head.append(mockupStyles);

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
  const scene = el('div', { className: 'home-scene', attrs: { 'aria-hidden': 'true' } }, ['todos', 'huapango', 'teatro'].flatMap((name) => ['light', 'dark'].map((mode) => el('img', { className: `scene-img scene-${name} mode-${mode}`, src: withBase(`/src/assets/mockup/hero-${name}-${mode}.webp`), alt: '', decoding: 'async' }))));
  const brand = el('div', { className: 'home-brand' }, [emblem('home-emblem'), el('div', { className: 'home-brand-copy' }, [el('h1', { text: 'CDMX Cuicoyan' }), el('p', { text: 'Donde la ciudad encuentra su escenario.' })]), el('a', { className: 'sparkle-button', href: routes.explorar, attrs: { 'aria-label': 'Descubrir y explorar' } }, [icon('sparkles', { size: 30 })])]);
  search.prepend(icon('search', { size: 26, className: 'search-icon' }));
  const hero = el('section', { className: 'hero' }, [scene, brand, el('div', { className: 'container hero-grid' }, [el('div', { className: 'hero-copy' }, [el('span', { className: 'eyebrow', text: 'Cultura viva en CDMX' }), heroTitle, el('p', { text: 'Eventos, artistas, foros y experiencias culturales de CDMX, reunidos para que encuentres tu próximo plan.' }), search, el('div', { className: 'hero-actions' }, [linkButton('Explorar Cuicoyan', routes.explorar), linkButton('Soy artista o foro', '#para-creadores', true)]), el('p', { className: 'muted hero-tagline', text: 'Donde la ciudad encuentra su escenario.' }), el('div', { className: 'quick-links', attrs: { 'aria-label': 'Accesos rápidos' } }, [['Cerca de ti','cerca'],['Este fin de semana','fin-de-semana'],['Gratis','libre'],['Para ir en familia','familia']].map(([label, value]) => el('a', { className: 'chip', href: `${routes.explorar}?intencion=${value}`, text: label }))) ]), el('div', { className: 'hero-art' }, [el('div', { className: 'hero-art-card' }, [el('img', { className: 'hero-art-image', src: withBase('/src/assets/cuicoyan/hero-cdmx.webp'), alt: 'Collage editorial de CDMX con Bellas Artes, flores, textiles y un instrumento de cuerda.', fetchpriority: 'high' }), el('span', { className: 'hero-art-word', text: 'CULTURA VIVA · CDMX', attrs: { 'aria-hidden': 'true' } })])])])]);
  const scenes = { huapango: 'huapango', teatro: 'teatro' };
  const eventList = el('div', { className: 'ev-list', attrs: { 'aria-live': 'polite' } });
  const eventCount = el('a', { className: 'count-link', href: routes.eventos });
  const home = { category: categories.some((c) => c.slug === readUrlState().categoria) ? readUrlState().categoria : 'todos' };
  const chips = categories.map((category) => { const chip = el('button', { className: 'cat-chip', type: 'button', dataset: { cat: category.slug }, style: `--chip-color:var(--${category.color === 'brand' ? 'primary' : category.color})` }, [icon(category.slug === 'todos' ? 'all' : category.slug, { size: 24, className: 'cat-icon' }), el('span', { text: category.label })]); chip.addEventListener('click', () => { home.category = category.slug; paintHome(); announce(`Categoría ${category.label}`); }); return chip; });
  function paintHome() {
    const shown = home.category === 'todos' ? events : events.filter((event) => (event.categorySlugs || []).includes(home.category));
    eventList.replaceChildren(...(shown.length ? shown.map(eventCard) : [el('div', { className: 'empty-state' }, [el('h3', { text: 'Aún no hay eventos en esta categoría' }), el('p', { className: 'muted', text: 'Prueba otra disciplina o revisa toda la agenda.' })])]));
    eventCount.replaceChildren(`${shown.length} evento${shown.length === 1 ? '' : 's'}`, icon('chevron', { size: 18 }));
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.cat === home.category)));
    const mainNode = document.getElementById('contenido'); if (mainNode) { mainNode.dataset.scene = scenes[home.category] || 'todos'; mainNode.dataset.cat = home.category; }
  }
  const categorySection = section('home-cats', [el('div', { className: 'section-heading' }, [el('span', { className: 'eyebrow', text: 'Explora a tu manera' }), el('h2', { text: '¿Qué te gustaría vivir?' }), el('p', { className: 'only-desktop', text: 'Empieza por lo que te mueve. Puedes cambiar de categoría, fecha o zona en cualquier momento.' })]), el('div', { className: 'cat-row', attrs: { role: 'group', 'aria-label': 'Categorías culturales' } }, chips), el('div', { className: 'intentions only-desktop' }, [['Cerca de ti','cerca'],['Este fin de semana','fin-de-semana'],['Entrada libre','libre'],['Para ir en familia','familia'],['Tradición','tradicion'],['Escena independiente','independiente']].map(([label,value]) => el('a', { className: 'chip', href: `${routes.explorar}?intencion=${value}`, text: label }))), el('p', { className: 'only-desktop', style: 'margin-top:1rem' }, [el('a', { className: 'button ghost', href: `${routes.explorar}#categorias`, text: 'Ver todas las categorías →' })])]);
  const eventsSection = section('home-agenda', [el('div', { className: 'agenda-head' }, [el('div', { className: 'section-heading' }, [el('span', { className: 'eyebrow', text: 'Agenda local' }), el('h2', {}, [el('span', { className: 'only-app', text: 'Próximos eventos' }), el('span', { className: 'only-desktop', text: 'Planes para encontrarte con la ciudad.' })]), el('p', { className: 'only-desktop', text: 'Explora una selección de música, danza, teatro y encuentros que están por suceder.' })]), eventCount]), eventList, el('p', { className: 'demo-note', text: 'Los registros de esta agenda son demostrativos y deben verificarse antes de publicar.' }), el('div', { className: 'only-desktop', style: 'margin-top:1.4rem' }, [linkButton('Ver todos los eventos', routes.eventos, true)])]);
  const homeMap = mapBlock(venues.slice(0, 4), 'venue-alicia');
  const mapSection = section('paper home-map', [sectionHeading('Mapa cultural', 'La cultura también se descubre caminando.', 'Ubica foros, eventos y espacios culturales por zona. Empieza en CDMX y acerca el mapa a tu barrio.'), el('div', { className: 'map-layout' }, [el('div', { className: 'place-rows' }, [...homeMap.rows, linkButton('Abrir mapa cultural', routes.mapa)]), homeMap.shell])]);
  const artistsSection = section('', [sectionHeading('Personas y colectivos', 'Artistas que están creando.', 'Conoce las voces, cuerpos, ideas y proyectos que mantienen en movimiento la cultura de la ciudad.'), demoNotice(), el('div', { className: 'grid grid-4' }, artists.slice(0, 4).map(artistCard)), el('div', { style: 'margin-top:1.4rem' }, [linkButton('Conocer artistas', routes.artistas, true)])]);
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
  $('#app').replaceWith(el('main', { id: 'contenido', className: 'home' }, [hero, categorySection, eventsSection, mapSection, artistsSection, venuesSection, benefitsSection, purposeSection, finalSection]));
  paintHome();
}

function renderExplore() {
  const state = readUrlState();
  renderExplorePage({ results: searchItems([...events, ...artists, ...venues], state), categories, state, navigate: (next) => goWithState(routes.explorar, next), eventCard, events });
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
  renderEventsPage({ items: events.filter((item) => eventMatchesState(item, state)), zones, categories, state, navigate: (next) => goWithState(routes.eventos, next), eventCard });
}
function renderArtists() { renderArtistsPage(artists, events); }
function renderVenues() { renderVenuesPage(venues); }

function renderDetail(type) {
  const slug = window.location.pathname.split('/').filter(Boolean).at(-1);
  const item = type === 'event' ? getEvent(slug) : type === 'artist' ? getArtist(slug) : getVenue(slug);
  if (!item) {
    if (type === 'event') { pageFrame({ eyebrow: 'Evento', title: 'Cargando evento…', description: '', children: [] }); void loadRemoteEvent(slug).then((remote) => { if (!window.location.pathname.endsWith(`/${slug}`)) return; remote ? renderCurrentRoute() : renderNotFound(); }); return; }
    return renderNotFound();
  }
  if (type === 'event') return renderEventDetail(item, { artists });
  if (type === 'artist') return renderArtistProfile(item, { events });
  return renderVenueProfile(item, { events });
}

function renderMap() { renderMapPage(venues); }

function renderFavorites() { renderFavoritesPage({ events, artists, venues }); }

function renderOnboarding() { const selected = new Set(getPreferences().interests); const form = el('form', { className: 'onboarding' }, [el('span', { className: 'eyebrow', text: 'Preferencias locales' }), el('h1', { text: '¿Qué te gustaría vivir?' }), el('p', { className: 'muted', text: 'Elige intereses para preparar tu exploración. No pedimos correo ni creamos una cuenta.' }), el('div', { className: 'interest-grid' }, categories.slice(1).map((category) => el('label', {}, [el('input', { type: 'checkbox', name: 'interest', value: category.slug, checked: selected.has(category.slug) }), el('span', { text: category.label })]))), el('div', { className: 'hero-actions' }, [el('button', { className: 'button', type: 'submit', text: 'Guardar intereses' }), el('a', { className: 'button secondary', href: routes.explorar, text: 'Omitir' })]), el('button', { className: 'button ghost', type: 'button', text: 'Borrar datos locales' })]); form.addEventListener('submit', (event) => { event.preventDefault(); savePreferences({ interests: [...form.querySelectorAll('input:checked')].map((input) => input.value) }); announce('Intereses guardados en este navegador'); window.location.href = routes.explorar; }); form.querySelector('.button.ghost').addEventListener('click', () => { clearPreferences(); announce('Datos locales borrados'); form.reset(); }); $('#app').replaceWith(el('main', { id: 'contenido' }, [form])); }

function renderCreators() { return pageFrame({ eyebrow: 'Para quienes hacen cultura', title: 'Tu proyecto también encuentra su escenario.', description: 'Una explicación del espacio de participación, sin promesas de alcance, comisión o resultados garantizados.', children: [section('', [el('div', { className: 'benefit-grid' }, [el('article', { className: 'benefit' }, [el('h2', { text: 'Artistas y colectivos' }), el('p', { text: 'Una presencia clara para reunir disciplinas, publicaciones y próximas fechas.' }), el('ul', {}, ['Perfil cultural propio','Eventos y foros relacionados','Información editable cuando exista un canal aprobado'].map((x) => el('li', { text: x }))), el('a', { className: 'button', href: `${routes.unete}?rol=artista`, text: 'Quiero registrar mi proyecto' })]), el('article', { className: 'benefit' }, [el('h2', { text: 'Foros y espacios' }), el('p', { text: 'Una ficha para mostrar qué sucede en tu espacio y cómo se conecta con la ciudad.' }), el('ul', {}, ['Ficha del espacio','Presencia en el mapa conceptual','Programación relacionada'].map((x) => el('li', { text: x }))), el('a', { className: 'button', href: `${routes.unete}?rol=foro`, text: 'Quiero sumar mi espacio' })])]), demoNotice()]) ] }); }
function renderJoin() {
  const titles = { foro: 'Suma tu espacio a Cuicoyan.', artista: 'Haz resonar tu proyecto.' };
  const steps = [['1', 'Llena el formulario', 'Cuéntanos quién eres y qué haces. Toma unos 3 minutos.'], ['2', 'Revisamos tu registro', 'El equipo verifica la información antes de publicar nada.'], ['3', 'Te escribimos', 'Recibirás respuesta en el correo que compartas.']];
  const aside = el('aside', { className: 'join-aside' }, [el('span', { className: 'badge', text: 'Registro gratuito' }), el('h2', { text: '¿Cómo funciona?' }), el('ol', { className: 'join-steps' }, steps.map(([n, title, copy]) => el('li', {}, [el('span', { text: n, attrs: { 'aria-hidden': 'true' } }), el('div', {}, [el('strong', { text: title }), el('p', { className: 'muted', text: copy })])]))), el('p', { className: 'muted', text: 'No creamos una cuenta ni publicamos tus datos de contacto. Solo usamos tu información para revisar tu registro.' })]);
  const initial = new URLSearchParams(window.location.search).get('rol');
  const main = pageFrame({ eyebrow: 'Participa', title: titles[initial] || 'Únete a Cuicoyan.', description: 'Registra tu proyecto o tu espacio y forma parte del mapa cultural de CDMX.', children: [section('', [el('div', { className: 'join-layout' }, [aside, joinForm(initial, (role) => { const url = new URL(window.location.href); url.searchParams.set('rol', role); history.replaceState(null, '', url); $('.page-hero h1').textContent = titles[role]; })])])] });
  return main;
}
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
function renderInfo(kind) { const content = { sobre: ['Sobre Cuicoyan', 'Una plataforma cultural para descubrir, conectar y compartir la vida cultural de CDMX.', 'Cuicoyan reúne eventos, artistas, foros y territorio en una experiencia de exploración clara. Esta entrega es un staging estático: no representa una operación activa ni afirma alianzas, cifras o infraestructura.'], ayuda: ['Centro de ayuda', 'Respuestas breves para recorrer el prototipo.', ''], accesibilidad: ['Accesibilidad', 'El sitio está construido con la accesibilidad como criterio de diseño.', 'Trabajamos para ofrecer navegación por teclado, foco visible, contraste AA, alternativa textual del mapa y respeto a reduced motion. El canal para reportar barreras queda pendiente de configuración.'], privacidad: ['Aviso de privacidad', 'Documento de staging pendiente de validación legal.', 'Esta versión no crea cuentas ni incorpora analítica. Si llenas un formulario de registro, tus datos se envían por correo al equipo de Cuicoyan (mediante el servicio FormSubmit) solo para revisar tu solicitud; no se publican. Tema, intereses y favoritos se guardan localmente en tu navegador y puedes borrarlos desde onboarding. Antes de publicar se requiere responsable, versión y texto legal aprobado.'], terminos: ['Términos y convivencia', 'Texto de staging pendiente de aprobación.', 'El contenido demostrativo no constituye una cartelera, promesa de disponibilidad ni contrato de compra. No hay pagos, reservas, boletos, cuentas ni publicaciones remotas en esta entrega.'] }; const [title, desc, body] = content[kind]; const children = [section('', [kind === 'ayuda' ? el('div', { className: 'faq' }, getHelp().map((item) => el('details', {}, [el('summary', { text: item.question }), el('p', { text: item.answer })]))) : el('div', { className: 'prose' }, [demoNotice(), el('p', { text: body }), kind === 'privacidad' || kind === 'terminos' ? el('p', { className: 'muted', text: 'Versión de staging · sin publicación legal definitiva.' }) : null])])]; return pageFrame({ eyebrow: kind === 'sobre' ? 'El lugar del canto' : 'Información', title, description: desc, children }); }
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
