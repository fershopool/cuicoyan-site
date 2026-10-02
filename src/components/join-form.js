import { el, announce } from '../utils/dom.js';
import { routes } from '../config/routes.js';
import { environment } from '../config/environment.js';

const ALCALDIAS = ['Álvaro Obregón', 'Azcapotzalco', 'Benito Juárez', 'Coyoacán', 'Cuajimalpa', 'Cuauhtémoc', 'Gustavo A. Madero', 'Iztacalco', 'Iztapalapa', 'Magdalena Contreras', 'Miguel Hidalgo', 'Milpa Alta', 'Tláhuac', 'Tlalpan', 'Venustiano Carranza', 'Xochimilco', 'Fuera de CDMX'];
const DISCIPLINAS = ['Huapango', 'Fandango', 'Danza', 'Teatro', 'Música', 'Talleres', 'Artes marciales', 'Cultura urbana', 'Otra'];

const REDES = [
  { name: 'Instagram', base: 'https://instagram.com/', placeholder: '@tuusuario' },
  { name: 'Facebook', base: 'https://facebook.com/', placeholder: 'Tu página o enlace' },
  { name: 'TikTok', base: 'https://tiktok.com/@', placeholder: '@tuusuario' },
  { name: 'YouTube', base: 'https://youtube.com/@', placeholder: '@tucanal o enlace' },
  { name: 'Sitio web u otra red', base: '', placeholder: 'https://…' },
];

// Convierte «@usuario», «usuario» o «sitio.com» en un enlace completo; devuelve '' si no es válido.
function toLink(value, base) {
  const v = value.trim();
  if (!v) return '';
  const raw = /^https?:\/\//i.test(v) ? v : /^(www\.)?[\w-]+(\.[\w-]+)+(\/|$)/i.test(v) && !v.startsWith('@') ? `https://${v}` : base ? `${base}${v.replace(/^@/, '')}` : `https://${v}`;
  try { return /^[\w.-]+$/.test(new URL(raw).hostname.replace(/\./g, '')) ? new URL(raw).href : ''; } catch { return ''; }
}

// `name` es la etiqueta que aparece como fila en el correo; `title` marca el dato que va en el asunto.
const contacto = [
  { name: 'Nombre de contacto', label: 'Tu nombre', required: true, autocomplete: 'name' },
  { name: 'email', label: 'Correo de contacto', type: 'email', required: true, autocomplete: 'email' },
  { name: 'Celular (WhatsApp)', label: 'Número de celular (WhatsApp)', type: 'tel', required: true, autocomplete: 'tel', placeholder: '10 dígitos, ej. 55 1234 5678' },
];

export const ROLES = {
  artista: {
    tag: 'ARTISTA', letter: 'A', label: 'Artista o colectivo', cta: 'Enviar registro de proyecto',
    fields: [
      { name: 'Nombre artístico o del colectivo', label: 'Nombre artístico o del colectivo', required: true, title: true },
      { name: 'Tipo de proyecto', label: 'Tipo de proyecto', options: ['Artista individual', 'Colectivo', 'Compañía', 'Taller o escuela'], required: true },
      { name: 'Integrantes', label: 'Número de integrantes (opcional)', type: 'number', min: 1 },
      { name: 'Trayectoria', label: 'Años de trayectoria', options: ['Menos de 1 año', '1 a 3 años', '4 a 10 años', 'Más de 10 años'], required: true },
      { name: 'Disciplinas', label: 'Disciplinas', checks: DISCIPLINAS, required: true, wide: true, cat: true },
      { name: 'Género o estilo', label: 'Género o estilo (opcional)', placeholder: 'Ej. son jarocho, danza contemporánea…' },
      { name: 'Alcaldía o zona', label: 'Alcaldía o zona donde te presentas', options: ALCALDIAS, required: true, zone: true },
      { name: 'Disponibilidad', label: 'Disponibilidad para presentarte (opcional)', checks: ['Entre semana', 'Fines de semana', 'Fuera de CDMX'], wide: true },
      { name: 'Requerimientos técnicos', label: 'Requerimientos técnicos (opcional)', area: true, wide: true, max: 500, placeholder: 'Sonido, iluminación, espacio mínimo, backline…' },
      { name: 'Descripción', label: 'Cuéntanos sobre tu proyecto', area: true, required: true, wide: true, max: 800 },
      { name: 'Material', label: 'Enlace a video o portafolio (opcional)', placeholder: 'https://…', wide: true },
      { name: 'Próximas fechas', label: 'Próximas fechas o presentaciones (opcional)', area: true, wide: true, max: 500 },
      { name: 'Redes sociales', label: 'Tus redes sociales (agrega al menos una)', redes: true, wide: true },
    ],
  },
  foro: {
    tag: 'FORO', letter: 'F', label: 'Foro o espacio', cta: 'Enviar registro de espacio',
    fields: [
      { name: 'Nombre del espacio', label: 'Nombre del foro o espacio', required: true, title: true },
      { name: 'Tipo de espacio', label: 'Tipo de espacio', options: ['Foro independiente', 'Centro cultural', 'Teatro', 'Galería o museo', 'Casa de cultura', 'Plaza o espacio abierto', 'Otro'], required: true, cat: true },
      { name: 'Dirección', label: 'Dirección completa', required: true, wide: true, autocomplete: 'street-address' },
      { name: 'Alcaldía o zona', label: 'Alcaldía', options: ALCALDIAS, required: true, zone: true },
      { name: 'Aforo aproximado', label: 'Aforo aproximado (personas)', type: 'number', min: 1, required: true },
      { name: 'Programación', label: 'Qué se presenta en tu espacio', checks: DISCIPLINAS, required: true, wide: true },
      { name: 'Frecuencia de programación', label: 'Frecuencia de programación', options: ['Diaria', 'Varias veces por semana', 'Semanal', 'Quincenal', 'Mensual', 'Ocasional'], required: true },
      { name: 'Convocatorias a artistas', label: '¿Reciben propuestas de artistas?', options: ['Sí', 'No', 'Por evaluar'], required: true },
      { name: 'Servicios y equipamiento', label: 'Servicios y equipamiento (opcional)', checks: ['Escenario', 'Sonido', 'Iluminación', 'Camerinos', 'Cafetería o bar', 'Estacionamiento', 'Taquilla'], wide: true },
      { name: 'Horario', label: 'Horario de atención (opcional)', placeholder: 'Ej. Mar a dom, 16:00 a 23:00' },
      { name: 'Accesibilidad', label: 'Accesibilidad (opcional)', placeholder: 'Rampas, baños, lengua de señas…' },
      { name: 'Descripción', label: 'Cuéntanos sobre el espacio', area: true, required: true, wide: true, max: 800 },
      { name: 'Redes sociales', label: 'Redes sociales del espacio (agrega al menos una)', redes: true, wide: true },
    ],
  },
};

function folio(letter) {
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }).replaceAll('-', '');
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join('');
  return `CY-${letter}-${day}-${rand}`;
}

function field(spec, id) {
  const base = { id, name: spec.name, required: !!spec.required, autocomplete: spec.autocomplete || 'off' };
  let control;
  if (spec.redes) {
    control = el('div', { className: 'social-grid' }, REDES.map((red, index) => el('label', { className: 'social-input' }, [
      el('span', { text: red.name }),
      el('input', { type: 'text', name: `red-${index}`, maxLength: 200, placeholder: red.placeholder, autocomplete: 'off', inputMode: 'url' }),
    ])));
  } else if (spec.checks) {
    control = el('div', { className: 'chip-options', attrs: { role: 'group', 'aria-labelledby': `${id}-label` } }, spec.checks.map((option) => el('label', {}, [el('input', { type: 'checkbox', name: spec.name, value: option }), el('span', { text: option })])));
  } else if (spec.options) {
    control = el('select', base, [el('option', { value: '', text: 'Selecciona una opción' }), ...spec.options.map((option) => el('option', { value: option, text: option }))]);
  } else if (spec.area) {
    control = el('textarea', { ...base, rows: 5, maxLength: spec.max || 800, placeholder: spec.placeholder || '' });
  } else {
    control = el('input', { ...base, type: spec.type || 'text', maxLength: 200, placeholder: spec.placeholder || '', min: spec.min });
  }
  return el('div', { className: `field${spec.wide ? ' wide' : ''}` }, [
    el('label', { htmlFor: spec.checks || spec.redes ? undefined : id, id: `${id}-label`, text: spec.label }),
    control,
  ]);
}

function successPanel(role, code, onReset) {
  return el('div', { className: 'join-success', attrs: { role: 'status' } }, [
    el('span', { className: 'join-success-mark', text: '✦', attrs: { 'aria-hidden': 'true' } }),
    el('h2', { text: '¡Recibimos tu registro!' }),
    el('p', { className: 'muted', text: `Tu folio es ${code}. Revisaremos la información y te escribiremos al correo que compartiste. Enviarlo no garantiza su publicación.` }),
    el('div', { className: 'hero-actions' }, [
      el('a', { className: 'button', href: routes.explorar, text: 'Seguir explorando' }),
      el('button', { className: 'button secondary', type: 'button', text: `Registrar otro ${role === 'foro' ? 'espacio' : 'proyecto'}`, onClick: onReset }),
    ]),
  ]);
}

export function joinForm(initialRole, onRoleChange) {
  const host = el('div', { className: 'join-card' });

  function draw(roleKey) {
    const role = ROLES[roleKey];
    const switcher = el('div', { className: 'role-switch', attrs: { role: 'tablist', 'aria-label': 'Tipo de registro' } }, Object.entries(ROLES).map(([key, item]) => el('button', {
      type: 'button', className: key === roleKey ? 'active' : '', text: item.label, attrs: { role: 'tab', 'aria-selected': String(key === roleKey) },
      onClick: () => { onRoleChange?.(key); draw(key); },
    })));

    const status = el('p', { className: 'form-status', attrs: { role: 'alert', 'aria-live': 'assertive' } });
    const honey = el('input', { type: 'text', name: '_honey', tabIndex: -1, autocomplete: 'off', attrs: { 'aria-hidden': 'true' } });
    const consent = el('label', { className: 'consent' }, [
      el('input', { type: 'checkbox', name: 'consentimiento', required: true }),
      el('span', {}, ['Acepto que Cuicoyan reciba estos datos por correo para revisar mi registro y contactarme. Puedo pedir que los eliminen en cualquier momento. ', el('a', { href: routes.privacidad, text: 'Aviso de privacidad' })]),
    ]);
    const submit = el('button', { className: 'button', type: 'submit', text: role.cta });
    const form = el('form', { className: 'join-form', attrs: { novalidate: '', 'aria-label': `Registro: ${role.label}` } }, [
      el('div', { className: 'field-grid' }, [...role.fields, ...contacto].map((spec, index) => field(spec, `jf-${roleKey}-${index}`))),
      el('div', { className: 'hp', attrs: { 'aria-hidden': 'true' } }, [honey]),
      consent, status, submit,
    ]);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = '';
      if (honey.value) return host.replaceChildren(successPanel(roleKey, 'CY-OK', () => draw(roleKey)));
      for (const spec of role.fields.filter((item) => item.checks && item.required)) {
        if (!form.querySelector(`input[name="${spec.name}"]:checked`)) { status.textContent = `Elige al menos una opción en «${spec.label}».`; return; }
      }
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const phone = form.elements['Celular (WhatsApp)'].value.replace(/\D/g, '');
      if (!/^(52)?1?\d{10}$/.test(phone)) { status.textContent = 'Escribe un número de celular válido de 10 dígitos.'; form.elements['Celular (WhatsApp)'].focus(); return; }
      const links = REDES.map((red, index) => ({ red, raw: form.elements[`red-${index}`].value, link: toLink(form.elements[`red-${index}`].value, red.base) }));
      const bad = links.find((item) => item.raw.trim() && !item.link);
      if (bad) { status.textContent = `Revisa el enlace de ${bad.red.name}.`; return; }
      if (!links.some((item) => item.link)) { status.textContent = 'Agrega al menos una red social o sitio web.'; return; }

      const data = Object.fromEntries(new FormData(form));
      const code = folio(role.letter);
      const zone = data[role.fields.find((item) => item.zone).name] || '';
      const title = data[role.fields.find((item) => item.title).name].trim();
      const catSpec = role.fields.find((item) => item.cat);
      const cat = (catSpec.checks ? form.querySelector(`input[name="${catSpec.name}"]:checked`)?.value : data[catSpec.name]) || 'General';
      const payload = {
        Folio: code, 'Tipo de registro': role.label, 'Categoría principal': cat, 'Fecha de envío': new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
      };
      [...role.fields, ...contacto].forEach((spec) => {
        if (spec.redes) { links.forEach((item) => { payload[item.red.name] = item.link || '—'; }); return; }
        payload[spec.name] = spec.checks ? [...form.querySelectorAll(`input[name="${spec.name}"]:checked`)].map((input) => input.value).join(', ') : (data[spec.name] || '').trim() || '—';
      });
      Object.assign(payload, {
        Consentimiento: 'Aceptado',
        _subject: `[CUICOYAN][${role.tag}][${cat}] ${title} · ${zone} · ${code}`,
        _template: 'table',
        _captcha: 'false',
        _replyto: payload.email,
        _autoresponse: `Hola ${payload['Nombre de contacto']}: recibimos tu registro en Cuicoyan (folio ${code}). Lo revisaremos y te escribiremos a este correo. Enviarlo no garantiza su publicación.`,
      });

      submit.disabled = true; submit.textContent = 'Enviando…';
      try {
        const response = await fetch(environment.joinFormEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || String(body.success) === 'false') throw new Error(body.message || 'rechazado');
        announce('Registro enviado');
        host.replaceChildren(successPanel(roleKey, code, () => draw(roleKey)));
        host.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        status.textContent = 'No pudimos enviar tu registro. Revisa tu conexión e inténtalo de nuevo.';
        submit.disabled = false; submit.textContent = role.cta;
      }
    });

    host.replaceChildren(switcher, form);
  }

  draw(initialRole in ROLES ? initialRole : 'artista');
  return host;
}
