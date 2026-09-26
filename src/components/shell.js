import { el, $, announce } from '../utils/dom.js';
import { routes, routeForPath, withBase } from '../config/routes.js';
import { environment } from '../config/environment.js';
import { getPreferences, savePreferences } from '../services/preferences.service.js';

const nav = [
  ['Inicio', routes.home, 'home'], ['Explorar', routes.explorar, 'explorar'], ['Eventos', routes.eventos, 'eventos'],
  ['Artistas', routes.artistas, 'artistas'], ['Foros', routes.foros, 'foros'], ['Mapa', routes.mapa, 'mapa'],
  ['Para creadores', routes.creadores, 'creadores'], ['Sobre Cuicoyan', routes.sobre, 'sobre'],
];

function link(label, href, key, current) { return el('a', { href, text: label, attrs: current === key ? { 'aria-current': 'page' } : {} }); }

function bottomLink(label, href, key, icon, current) {
  return el('a', { className: 'bottom-nav-link', href, attrs: current === key ? { 'aria-current': 'page' } : {} }, [
    el('span', { className: 'bottom-nav-icon', attrs: { 'aria-hidden': 'true' }, text: icon }),
    el('small', { text: label }),
  ]);
}

export function renderShell(routeKey) {
  ensureSiteIcon();
  const current = routeKey || routeForPath();
  const bottomItems = [
    ['Inicio', routes.home, 'home', '⌂'],
    ['Explorar', routes.explorar, 'explorar', '⌕'],
    ['Eventos', routes.eventos, 'eventos', '◷'],
    ['Mapa', routes.mapa, 'mapa', '⌖'],
  ];
  const header = el('header', { className: 'site-header' }, [
    el('div', { className: 'container header-inner' }, [
      el('a', { className: 'brand', href: routes.home, attrs: { 'aria-label': 'Cuicoyan, inicio' } }, [el('img', { src: relativeAsset('public/cuicoyan-logo.png'), alt: '' }), el('span', { className: 'brand-copy' }, [el('strong', { className: 'brand-name', text: 'Cuicoyan' }), el('small', { className: 'brand-tagline', text: 'Donde la ciudad\nencuentra su escenario.' })])]),
      el('nav', { className: 'main-nav', attrs: { 'aria-label': 'Navegación principal' } }, nav.map(([label, href, key]) => link(label, href, key, current))),
      el('div', { className: 'header-tools' }, [
        el('button', { className: 'icon-button theme-toggle', id: 'theme-toggle', type: 'button', attrs: { 'aria-label': 'Cambiar tema', 'aria-pressed': 'false' } }, [el('span', { attrs: { 'aria-hidden': 'true' }, text: '☼' }), el('span', { attrs: { 'aria-hidden': 'true' }, text: '◐' })]),
        el('a', { className: 'button', href: routes.unete, text: 'Únete a Cuicoyan' }),
      ]),
    ]),
    el('div', { className: 'mobile-drawer', id: 'mobile-drawer', attrs: { hidden: '' } }, [el('nav', { attrs: { 'aria-label': 'Navegación móvil' } }, nav.map(([label, href, key]) => link(label, href, key, current))), el('a', { className: 'button', href: routes.unete, text: 'Únete a Cuicoyan' })]),
    el('nav', { className: 'bottom-nav', attrs: { 'aria-label': 'Navegación rápida' } }, [
      ...bottomItems.map(([label, href, key, icon]) => bottomLink(label, href, key, icon, current)),
      el('button', { className: 'bottom-nav-more', id: 'menu-toggle', type: 'button', attrs: { 'aria-label': 'Abrir menú', 'aria-expanded': 'false', 'aria-controls': 'mobile-drawer' } }, [
        el('span', { className: 'bottom-nav-icon', attrs: { 'aria-hidden': 'true' }, text: '☰' }),
        el('small', { text: 'Más' }),
      ]),
    ]),
  ]);
  document.body.prepend(el('a', { className: 'skip-link', href: '#contenido', text: 'Saltar al contenido' }));
  document.body.prepend(header);
  document.body.append(el('div', { id: 'site-live', className: 'sr-only', attrs: { 'aria-live': 'polite', 'aria-atomic': 'true' } }));
  setupShell();
}

function ensureSiteIcon() {
  const icon = document.querySelector('link[rel="icon"]') || document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/png';
  icon.href = withBase('/public/cuicoyan-logo.png?v=2');
  if (!icon.isConnected) document.head.append(icon);
}

function relativeAsset(path) {
  return withBase(`/${path}`);
}

function setupShell() {
  const prefs = getPreferences();
  const root = document.documentElement;
  root.dataset.theme = prefs.theme || 'system';
  const toggle = $('#theme-toggle');
  toggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : root.dataset.theme === 'light' ? 'system' : 'dark';
    root.dataset.theme = next; savePreferences({ theme: next }); toggle.setAttribute('aria-label', `Tema ${next}`); announce(`Tema ${next === 'system' ? 'del sistema' : next} activado`);
  });
  const menu = $('#menu-toggle'); const drawer = $('#mobile-drawer');
  menu?.addEventListener('click', () => { const open = !drawer.hidden; drawer.hidden = open; drawer.classList.toggle('open', !open); menu.setAttribute('aria-expanded', String(!open)); menu.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú'); if (!open) drawer.querySelector('a')?.focus(); });
  drawer?.addEventListener('click', (event) => { if (event.target.matches('a')) { drawer.hidden = true; drawer.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); } });
}

export function renderFooter() {
  const ollin = environment.ollinUrl;
  document.body.append(el('footer', { className: 'site-footer' }, [
    el('div', { className: 'container' }, [
      el('div', { className: 'footer-grid' }, [
        el('div', { className: 'prose' }, [el('a', { className: 'brand', href: routes.home }, [el('img', { src: relativeAsset('public/cuicoyan-logo.png'), alt: '' }), el('span', { className: 'brand-copy' }, [el('strong', { className: 'brand-name', text: 'Cuicoyan' }), el('small', { className: 'brand-tagline', text: 'Donde la ciudad encuentra su escenario.' })])]), el('p', { className: 'muted', text: 'Una guía para encontrar cultura viva cerca de ti.' }), el('p', { className: 'demo-label', text: 'Staging estático' })]),
        el('nav', { attrs: { 'aria-label': 'Descubrimiento' } }, [el('strong', { text: 'Descubre' }), el('a', { href: routes.explorar, text: 'Explorar' }), el('a', { href: routes.eventos, text: 'Eventos' }), el('a', { href: routes.artistas, text: 'Artistas' }), el('a', { href: routes.foros, text: 'Foros' }), el('a', { href: routes.mapa, text: 'Mapa cultural' })]),
        el('nav', { attrs: { 'aria-label': 'Participación' } }, [el('strong', { text: 'Participa' }), el('a', { href: routes.creadores, text: 'Para creadores' }), el('a', { href: routes.unete, text: 'Únete' }), el('a', { href: routes.convocatorias, text: 'Convocatorias' }), el('a', { href: routes.favoritos, text: 'Favoritos' })]),
        el('nav', { attrs: { 'aria-label': 'Información' } }, [el('strong', { text: 'Cuicoyan' }), el('a', { href: routes.sobre, text: 'Sobre Cuicoyan' }), el('a', { href: routes.ayuda, text: 'Ayuda' }), el('a', { href: routes.accesibilidad, text: 'Accesibilidad' }), el('a', { href: routes.privacidad, text: 'Privacidad' }), el('a', { href: routes.terminos, text: 'Términos' })]),
      ]),
      el('div', { className: 'footer-bottom' }, [el('span', { text: 'Contenido demostrativo: verifica datos, derechos y canales antes de publicar.' }), ollin ? el('a', { href: ollin, text: 'Conoce a Ollin', attrs: { target: '_blank', rel: 'noopener noreferrer' } }) : el('span', { text: 'Arquitectura por Ollin · enlace pendiente' })]),
    ]),
  ]));
}
