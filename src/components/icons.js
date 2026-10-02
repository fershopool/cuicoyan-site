// Iconos de línea (24×24) para la interfaz tipo app de los mockups. Trazo = currentColor.
const paths = {
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01M16 17h.01" stroke-width="2.4"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.4-3.6 2.7-5.6 6-5.6s5.6 2 6 5.6"/><circle cx="17" cy="9" r="2.6"/><path d="M16.2 14.6c2.6-.2 4.5 1.5 4.8 4.4"/>',
  map: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
  heart: '<path d="M12 20.5C5.5 16 3 12.6 3 9.3 3 6.6 5 4.6 7.5 4.6c1.8 0 3.4 1 4.5 2.6 1.1-1.6 2.7-2.6 4.5-2.6C19 4.6 21 6.6 21 9.3c0 3.3-2.5 6.7-9 11.2z"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.6 4.6"/>',
  sparkles: '<path d="M10 3.5c.7 4 2.2 5.5 6.2 6.2-4 .7-5.5 2.2-6.2 6.2-.7-4-2.2-5.5-6.2-6.2 4-.7 5.5-2.2 6.2-6.2z"/><path d="M18 14c.4 2.2 1.1 2.9 3.2 3.2-2.100.4-2.800 1.100-3.200 3.200-.4-2.100-1.100-2.800-3.200-3.200 2.100-.3 2.800-1 3.200-3.200z"/><path d="M18.500 3v3M17 4.500h3" stroke-width="1.5"/>',
  pin: '<path d="M12 21s-6.5-5.600-6.500-11a6.500 6.500 0 0 1 13 0C18.500 15.400 12 21 12 21z"/><circle cx="12" cy="10" r="2.400"/>',
  home: '<path d="M4 11 12 4l8 7v8.500a1 1 0 0 1-1 1h-4.500v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  share: '<path d="M21 3 3 10.500l7 3 3 7z"/><path d="m10 13.500 11-10.500"/>',
  comment: '<path d="M4 5.500A2.500 2.500 0 0 1 6.500 3h11A2.500 2.500 0 0 1 20 5.500v8a2.500 2.500 0 0 1-2.500 2.500H11l-5 4.500V16a2 2 0 0 1-2-2z"/>',
  bookmark: '<path d="M6 3.500h12v17l-6-4.500-6 4.500z"/>',
  filter: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.800v2.400M12 18.800v2.400M21.200 12h-2.400M5.200 12H2.800M18.500 5.500l-1.700 1.700M7.200 16.800l-1.700 1.700M18.500 18.500l-1.700-1.700M7.200 7.200 5.500 5.500"/>',
  bell: '<path d="M6 16.500V11a6 6 0 0 1 12 0v5.500l1.500 2h-15z"/><path d="M10 21h4"/>',
  user: '<circle cx="12" cy="8.500" r="3.800"/><path d="M4.500 20.500c.6-4 3.500-6 7.500-6s6.900 2 7.500 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.500v2.200M12 19.300v2.200M2.500 12h2.200M19.300 12h2.200M5.300 5.300l1.500 1.500M17.200 17.200l1.500 1.500M18.700 5.300l-1.500 1.500M6.800 17.200l-1.500 1.500"/>',
  moon: '<path d="M20 14.500A8.500 8.500 0 0 1 9.500 4 8.500 8.500 0 1 0 20 14.500z"/>',
  clock: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>',
  phone: '<path d="M5 4h4l1.500 4-2 1.500a11 11 0 0 0 6 6L16.500 13.500 20.500 15v4a1.500 1.500 0 0 1-1.500 1.500A15 15 0 0 1 3.500 5.500 1.500 1.500 0 0 1 5 4z"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v4.500A1.500 1.500 0 0 1 16.500 20h-11A1.500 1.500 0 0 1 4 18.500v-11A1.500 1.500 0 0 1 5.500 6H10"/>',
  access: '<circle cx="12" cy="4.500" r="1.800"/><path d="M5 8.500c4.600 1.600 9.400 1.600 14 0M12 8.500V14M12 14l-3.500 6.500M12 14l3.500 6.500"/>',
  image: '<rect x="3.500" y="4.500" width="17" height="15" rx="2.500"/><circle cx="9" cy="10" r="1.500"/><path d="m4 17 5-4.500 4 3.500 3-2.500 4 3.500"/>',
  play: '<path d="M8 5.500v13l11-6.500z" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  phoneDevice: '<rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path d="M11 18.500h2"/>',
  flower: '<path d="M12 2.500l3.500 3.500-3.500 3.500L8.500 6zM5 9.500 8.500 13 5 16.500 1.500 13zM19 9.500l3.500 3.500-3.500 3.500-3.500-3.500zM12 16l3.500 3.500L12 23l-3.500-3.500z"/><circle cx="12" cy="13" r="1.600"/>',
  clover: '<circle cx="8.500" cy="8.500" r="3.500"/><circle cx="15.500" cy="8.500" r="3.500"/><circle cx="8.500" cy="15.500" r="3.500"/><circle cx="15.500" cy="15.500" r="3.500"/>',
  all: '<path d="M12 3c.9 5 3 8.100 9 9-6 .9-8.100 4-9 9-.9-5-3-8.100-9-9 6-.9 8.100-4 9-9z"/>',
  huapango: '<path d="M2.500 15.500c3 2.700 16.500 2.700 19 0"/><path d="M6.500 15c-.3-5.500 1.500-9.500 5.500-9.500s5.800 4 5.500 9.500"/><path d="M6.700 12.200c3.500 1.300 6.100 1.300 10.600 0"/><path d="M9 21h6" />',
  fandango: '<path d="M12 20.500 3.800 9.500a11 11 0 0 1 16.400 0z"/><path d="M12 20.500V6.200M7.500 14.500 9 7M16.500 14.500 15 7"/><circle cx="12" cy="3.500" r="1" />',
  danza: '<circle cx="12" cy="4.500" r="2"/><path d="M4.500 9.500 12 11.500l7.500-2"/><path d="M12 11.500v3.500M12 15l-4.500 6M12 15l4.500 6"/>',
  teatro: '<path d="M3.500 3.500h17v2c-2.200 0-3.500 4.500-3.500 9 0 2.500.8 4.500.8 5.500H6.200c0-1 .8-3 .8-5.500 0-4.500-1.300-9-3.500-9z"/><path d="M12 5.500v14.500M9 11.500c1 1 2 1 3 0M15 11.500c-1 1-2 1-3 0"/>',
  musica: '<path d="M9 18V6.500L20 4v12"/><circle cx="6.200" cy="18" r="2.800"/><circle cx="17.200" cy="16" r="2.800"/>',
  talleres: '<path d="M5 20 4 15l9.500-9.500 3.500 3.500L7.500 18.500z"/><path d="m12 7 3.500 3.500M17.500 3.500l3 3"/>',
  'artes-marciales': '<circle cx="9" cy="4.200" r="2"/><path d="m9 7 3 4 5-1.500M12 11l-3.500 5L4 17.500M12 11l4.500 4.500 3.500.5"/>',
  'cultura-urbana': '<path d="M3.500 20.500V9.500h5.500v11M9 20.500V3.500h6.500v17M15.500 20.500V11.500h5v9M2.500 20.500h19"/><path d="M11.500 7h2M11.500 11h2M11.500 15h2" stroke-width="2"/>',
};

export function icon(name, { size = 24, className = '', strokeWidth = 1.7 } = {}) {
  const span = document.createElement('span');
  span.className = `ic ${className}`.trim();
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
  return span;
}

// Emblema de la app (teselado "C" con patrón geométrico), usado en el encabezado móvil.
export function emblem(className = '') {
  const span = document.createElement('span');
  span.className = `emblem ${className}`.trim();
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
      <linearGradient id="em-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4145f"/><stop offset=".55" stop-color="#7b1c8f"/><stop offset="1" stop-color="#0a2a6b"/></linearGradient>
      <linearGradient id="em-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5fa2"/><stop offset=".5" stop-color="#b45cff"/><stop offset="1" stop-color="#17e0e4"/></linearGradient>
    </defs>
    <rect x="2" y="2" width="96" height="96" rx="24" fill="url(#em-bg)"/>
    <rect x="5" y="5" width="90" height="90" rx="21" fill="none" stroke="url(#em-ring)" stroke-width="3"/>
    <g fill="none" stroke="#ffffff" stroke-opacity=".34" stroke-width="1.4">
      <path d="M13 24l5-5 5 5-5 5zM77 24l5-5 5 5-5 5zM13 76l5-5 5 5-5 5zM77 76l5-5 5 5-5 5z"/>
      <path d="M32 12h10l3 4-3 4H32zM58 88h10l-3-4 3-4H58zM12 40v10l4 3 4-3V40zM88 60V50l-4-3-4 3v10z"/>
    </g>
    <g fill="#17e0e4" fill-opacity=".75"><circle cx="50" cy="10.500" r="1.500"/><circle cx="50" cy="89.500" r="1.500"/><circle cx="10.500" cy="50" r="1.500"/><circle cx="89.500" cy="50" r="1.500"/></g>
    <text x="50" y="69" text-anchor="middle" font-family="Manrope, 'Bricolage Grotesque', sans-serif" font-weight="800" font-size="62" fill="#fff" style="paint-order:stroke" stroke="#3a0b57" stroke-width="2">C</text>
  </svg>`;
  return span;
}
