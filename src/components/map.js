import { el } from '../utils/dom.js';
import { routes } from '../config/routes.js';

export function mapView(venues, selectedId = 'venue-alicia') {
  const list = el('div', { className: 'map-list', attrs: { 'aria-label': 'Espacios del mapa' } });
  const map = el('div', { className: 'map-card', role: 'region', attrs: { 'aria-label': 'Mapa conceptual de espacios culturales de CDMX' } });
  venues.forEach((venue, index) => { const point = venue.mapPoint || { x: 50, y: 50 }; const pin = el('button', { className: 'map-pin', type: 'button', style: `left:${point.x}%;top:${point.y}%`, attrs: { 'aria-label': `Seleccionar ${venue.name}`, 'aria-pressed': String(venue.id === selectedId) } }, [el('span', { text: String(index + 1) })]); pin.addEventListener('click', () => select(venue.id)); map.append(pin); const item = el('a', { className: `map-list-item${venue.id === selectedId ? ' active' : ''}`, href: routes.foro(venue.slug), dataset: { venueId: venue.id } }, [el('strong', { text: venue.name }), el('span', { className: 'muted', text: `${venue.zone} · ${venue.categories.join(' · ')}` }), venue.mapPoint?.isConceptual ? el('small', { className: 'muted', text: 'Punto conceptual · por verificar' }) : null]); item.addEventListener('mouseenter', () => select(venue.id)); item.addEventListener('focus', () => select(venue.id)); list.append(item); });
  function select(id) { map.querySelectorAll('.map-pin').forEach((pin, index) => pin.setAttribute('aria-pressed', String(venues[index].id === id))); list.querySelectorAll('[data-venue-id]').forEach((item) => item.classList.toggle('active', item.dataset.venueId === id)); }
  return { map, list };
}
