import { el, announce } from '../utils/dom.js';
import { routes, withBase } from '../config/routes.js';
import { getVenueById } from '../services/content.service.js';
import { isFavorite, toggleFavorite } from '../services/favorites.service.js';
import { getCategories } from '../services/content.service.js';
import { icon } from './icons.js';

export const asset = (name) => withBase(`/src/assets/mockup/${name}.webp`);
const avatarFiles = { 'luna-mestiza': 'avatar-luna-mestiza', 'raices-del-viento': 'avatar-raices-del-viento', 'calle-azul': 'avatar-calle-azul', 'teatro-nube': 'avatar-teatro-nube', 'marea-roja': 'avatar-marea-roja' };
export function avatar(artist, className = 'avatar') {
  const file = avatarFiles[artist.slug];
  if (artist.photo) return el('img', { className, src: artist.photo, alt: '', loading: 'lazy', decoding: 'async' });
  if (file) return el('img', { className, src: asset(file), alt: '', loading: 'lazy', decoding: 'async' });
  return el('span', { className: `${className} avatar-initials`, attrs: { 'aria-hidden': 'true' }, text: artist.name.split(' ').map((part) => part[0]).join('').slice(0, 2) });
}

const tones = { pink: ['#E91662','#8A3FFC'], purple: ['#7936D2','#008EB5'], orange: ['#E96F00','#E91662'], turquoise: ['#009BA5','#7936D2'], blue: ['#008EB5','#009BA5'] };
const eventImages = {
  'sones-del-barrio': 'event-sones-del-barrio.webp',
  'fandango-con-la-plaza': 'event-fandango-con-la-plaza.webp',
  'la-ciudad-en-azul': 'event-la-ciudad-en-azul.webp',
  'cuentos-para-volar': 'event-cuentos-para-volar.webp',
};
const venueImages = { 'venue-alicia': 'venue-foro-alicia.webp' };

export function eventImageUrl(event) { return event?.imageUrl || (eventImages[event?.slug] ? withBase(`/src/assets/cuicoyan/${eventImages[event.slug]}`) : ''); }
export function venueImageUrl(venue) { return venue?.photo || (venueImages[venue?.id] ? withBase(`/src/assets/cuicoyan/${venueImages[venue.id]}`) : ''); }

function media(title, tone = 'pink', image = '', alt = title) {
  const [a, b] = tones[tone] || tones.pink;
  const children = image
    ? [el('img', { className: 'card-media-image', src: image, alt, loading: 'lazy', decoding: 'async' })]
    : [el('strong', { text: title })];
  return el('div', { className: 'card-media', style: `--media-a:${a};--media-b:${b}` }, children);
}

export function favoriteButton(type, id, label) {
  const saved = isFavorite(type, id);
  const button = el('button', { className: `favorite-button${saved ? ' is-saved' : ''}`, type: 'button', attrs: { 'aria-pressed': String(saved), 'aria-label': `${saved ? 'Quitar de' : 'Guardar en'} favoritos: ${label}` } }, [icon('heart', { size: 26 })]);
  button.addEventListener('click', () => {
    const next = toggleFavorite(type, id);
    button.classList.toggle('is-saved', next);
    button.setAttribute('aria-pressed', String(next));
    button.setAttribute('aria-label', `${next ? 'Quitar de' : 'Guardar en'} favoritos: ${label}`);
    announce(next ? `${label} guardado en favoritos` : `${label} eliminado de favoritos`);
  });
  return button;
}

// "Sáb 8 de agosto · 6:00 p. m." -> { date: "Sáb 8 De Ago", time: "6:00 p.m." }
export function eventDateParts(label = '') {
  const [date, time = ''] = label.split('·').map((part) => part.trim());
  const short = date.replace(/(\d+) de (\p{L}{3})\p{L}*/iu, (_, day, month) => `${day} De ${month[0].toUpperCase()}${month.slice(1).toLowerCase()}`);
  return { date: short, time: time.replace('a. m.', 'a.m.').replace('p. m.', 'p.m.') };
}

export const eventArtKeys = { 'sones-del-barrio': 'ev-sones', 'fandango-con-la-plaza': 'ev-fandango', 'cuentos-para-volar': 'ev-cuentos' };
const eventTones = { huapango: 'rose', teatro: 'ember', fandango: 'azure', musica: 'violet', danza: 'violet' };

function eventArt(event) {
  const key = eventArtKeys[event.slug];
  if (key) return ['light', 'dark'].map((mode) => el('img', { className: `ev-img mode-${mode}`, src: withBase(`/src/assets/mockup/${key}-${mode}.webp`), alt: '', loading: 'lazy', decoding: 'async' }));
  const url = eventImageUrl(event);
  return url ? [el('img', { className: 'ev-img', src: url, alt: '', loading: 'lazy', decoding: 'async' })] : [];
}

export function eventCard(event) {
  const venue = getVenueById(event.venueId);
  const venueName = event.venueName || venue?.name || 'Sede por confirmar';
  const { date, time } = eventDateParts(event.dateLabel);
  const labels = Object.fromEntries(getCategories().map((category) => [category.slug, category.label]));
  const description = (event.description || '').replace(/^Contenido de demostración:\s*/i, '').replace(/^./, (c) => c.toUpperCase());
  return el('article', { className: 'ev-card', dataset: { tone: eventTones[event.categorySlugs?.[0]] || 'rose', ...(eventArtKeys[event.slug] ? {} : { photo: '' }) } }, [
    el('div', { className: 'ev-art', attrs: { 'aria-hidden': 'true' } }, eventArt(event)),
    el('div', { className: 'ev-date' }, [icon('calendar', { size: 40, className: 'ev-cal', strokeWidth: 1.5 }), el('div', {}, [el('strong', { text: date }), time ? el('span', { text: time }) : null])]),
    el('h3', { className: 'ev-title' }, [el('a', { href: routes.evento(event.slug), text: event.title })]),
    el('p', { className: 'ev-desc', text: description }),
    el('p', { className: 'ev-venue' }, [icon('pin', { size: 20 }), el('span', { text: venueName })]),
    el('div', { className: 'ev-tags' }, (event.categorySlugs || []).map((slug) => el('span', { className: 'ev-tag', dataset: { cat: slug }, text: labels[slug] || slug }))),
    el('small', { className: 'ev-audience', text: event.audience }),
    el('strong', { className: 'ev-price', text: event.priceLabel }),
    favoriteButton('event', event.id, event.title),
    event.isDemo === false ? null : el('span', { className: 'sr-only', text: 'Evento demostrativo' }),
  ]);
}

export function artistCard(artist) {
  return el('article', { className: 'artist-card' }, [
    el('span', { className: 'artist-card-ring' }, [avatar(artist)]),
    el('h3', {}, [el('a', { href: routes.artista(artist.slug), text: artist.name })]),
    el('p', { className: 'artist-tags' }, [el('span', { text: artist.discipline }), el('i', { text: '•', attrs: { 'aria-hidden': 'true' } }), el('span', { text: artist.tagline })]),
    el('p', { className: 'artist-bio', text: artist.bio }),
    el('span', { className: 'see-all' }, ['Ver perfil', icon('chevron', { size: 16 })]),
  ]);
}

export function venueCard(venue) {
  const photo = venueImageUrl(venue);
  return el('article', { className: 'venue-card' }, [
    el('div', { className: 'venue-card-media', attrs: { 'aria-hidden': 'true' } }, [photo ? el('img', { src: photo, alt: '', loading: 'lazy', decoding: 'async' }) : icon('flower', { size: 48, strokeWidth: 1.3 })]),
    el('div', { className: 'venue-card-body' }, [
      el('h3', {}, [el('a', { href: routes.foro(venue.slug), text: venue.name })]),
      el('p', { className: 'venue-row-where' }, [el('strong', { text: venue.zone }), ` • ${venue.categories.join(' · ')}`]),
      el('p', { className: 'artist-bio', text: venue.description }),
      el('span', { className: 'see-all' }, ['Ver espacio', icon('chevron', { size: 16 })]),
    ]),
  ]);
}
