import { el, announce } from '../utils/dom.js';
import { routes, withBase } from '../config/routes.js';
import { getVenueById } from '../services/content.service.js';
import { isFavorite, toggleFavorite } from '../services/favorites.service.js';

const tones = { pink: ['#E91662','#8A3FFC'], purple: ['#7936D2','#008EB5'], orange: ['#E96F00','#E91662'], turquoise: ['#009BA5','#7936D2'], blue: ['#008EB5','#009BA5'] };
const eventImages = {
  'sones-del-barrio': 'event-sones-del-barrio.webp',
  'fandango-con-la-plaza': 'event-fandango-con-la-plaza.webp',
  'la-ciudad-en-azul': 'event-la-ciudad-en-azul.webp',
  'cuentos-para-volar': 'event-cuentos-para-volar.webp',
};
const venueImages = { 'venue-alicia': 'venue-foro-alicia.webp' };

export function eventImageUrl(event) { return eventImages[event?.slug] ? withBase(`/src/assets/cuicoyan/${eventImages[event.slug]}`) : ''; }
export function venueImageUrl(venue) { return venueImages[venue?.id] ? withBase(`/src/assets/cuicoyan/${venueImages[venue.id]}`) : ''; }

function media(title, tone = 'pink', image = '', alt = title) {
  const [a, b] = tones[tone] || tones.pink;
  const children = image
    ? [el('img', { className: 'card-media-image', src: image, alt, loading: 'lazy', decoding: 'async' })]
    : [el('strong', { text: title })];
  return el('div', { className: 'card-media', style: `--media-a:${a};--media-b:${b}` }, children);
}

function favoriteButton(type, id, label) {
  const saved = isFavorite(type, id);
  const button = el('button', { className: 'favorite-button', type: 'button', text: saved ? '♥' : '♡', attrs: { 'aria-pressed': String(saved), 'aria-label': `${saved ? 'Quitar de' : 'Guardar en'} favoritos: ${label}` } });
  button.addEventListener('click', () => {
    const next = toggleFavorite(type, id);
    button.textContent = next ? '♥' : '♡';
    button.setAttribute('aria-pressed', String(next));
    button.setAttribute('aria-label', `${next ? 'Quitar de' : 'Guardar en'} favoritos: ${label}`);
    announce(next ? `${label} guardado en favoritos` : `${label} eliminado de favoritos`);
  });
  return button;
}

export function eventCard(event) {
  const venue = getVenueById(event.venueId);
  return el('article', { className: 'card event-card' }, [
    el('div', { className: 'card-media-wrap' }, [media(event.title, event.imageTone, eventImageUrl(event), `Imagen demostrativa de ${event.title}`), favoriteButton('event', event.id, event.title)]),
    el('div', { className: 'card-body' }, [
      el('span', { className: 'demo-label', text: 'Demostración' }),
      el('h3', { text: event.title }),
      el('div', { className: 'card-meta' }, [el('span', { text: `◷ ${event.dateLabel}` }), el('span', { text: `⌖ ${venue?.name || 'Sede por confirmar'} · ${venue?.zone || 'CDMX'}` })]),
      el('p', { className: 'muted', text: event.description }),
      el('div', { className: 'category-row' }, event.categorySlugs.map((category) => el('span', { className: 'badge', text: category }))),
      el('div', { className: 'card-footer' }, [el('strong', { text: event.priceLabel }), el('a', { className: 'button ghost', href: routes.evento(event.slug), text: 'Ver evento →' })]),
    ]),
  ]);
}

export function artistCard(artist) {
  return el('article', { className: 'profile-card artist-card' }, [
    el('div', { className: 'profile-avatar', style: `--avatar-a:${tones[artist.tone]?.[0] || '#E91662'};--avatar-b:${tones[artist.tone]?.[1] || '#7936D2'}`, attrs: { 'aria-hidden': 'true' }, text: artist.name.split(' ').map((part) => part[0]).join('').slice(0, 2) }),
    el('span', { className: 'demo-label', text: 'Perfil demostrativo' }),
    el('h3', { text: artist.name }),
    el('p', { className: 'muted', text: `${artist.discipline} · ${artist.tagline}` }),
    el('p', { text: artist.bio }),
    el('a', { className: 'button ghost', href: routes.artista(artist.slug), text: 'Ver perfil →' }),
  ]);
}

export function venueCard(venue) {
  return el('article', { className: 'card venue-card' }, [
    el('div', { className: 'card-media-wrap' }, [media(venue.name, venue.id === 'venue-alicia' ? 'purple' : 'turquoise', venueImageUrl(venue), `Imagen demostrativa de ${venue.name}`)]),
    el('div', { className: 'card-body' }, [
      el('span', { className: 'demo-label', text: 'Espacio demostrativo' }),
      el('h3', { text: venue.name }),
      el('p', { className: 'muted', text: `${venue.zone} · ${venue.categories.join(' · ')}` }),
      el('p', { text: venue.description }),
      el('a', { className: 'button ghost', href: routes.foro(venue.slug), text: 'Ver espacio →' }),
    ]),
  ]);
}
