// Piezas comunes de los editores de perfil (artista y foro): hero con portada/foto, kit de campos y armazón del editor.
import { el, $, announce } from '../utils/dom.js';
import { icon } from './icons.js';
import { avatar } from './cards.js';
import { COVER_TONES, FONTS, SOCIALS, normalizeDraft, saveDraft, removeDraft } from '../services/profile-draft.service.js';

export const PALETTE = ['#E91662', '#8A3FFC', '#009BA5', '#E96F00', '#0B7A55', '#1766B3'];
export const get = (o, p) => p.split('.').reduce((x, k) => x?.[k], o);
export const set = (o, p, v) => { const k = p.split('.'); const last = k.pop(); k.reduce((x, i) => x[i], o)[last] = v; };
export const clone = (o) => JSON.parse(JSON.stringify(o));

// Validaciones (devuelven el mensaje de error o '').
export const required = (label) => (v) => (String(v || '').trim() ? '' : `${label} es obligatorio.`);
export const urlOk = (v) => { if (!v) return ''; try { return /^https?:$/.test(new URL(v).protocol) ? '' : 'Usa una dirección que empiece con http:// o https://.'; } catch { return 'Escribe una dirección válida, por ejemplo https://ejemplo.mx.'; } };
export const emailOk = (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Escribe un correo válido, por ejemplo nombre@dominio.mx.');
export const phoneOk = (v) => (!v || (/^\+?[\d\s().-]{7,20}$/.test(v) && v.replace(/\D/g, '').length >= 7) ? '' : 'Escribe un teléfono válido (7 a 15 dígitos).');
export const safeUrl = (v) => (v && urlOk(v) === '' ? v : '');

// Reduce la imagen elegida para que quepa en el almacenamiento del navegador.
export function readImage(file, maxSide, square) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = square ? Math.min(img.width, img.height) : null;
      const scale = Math.min(1, maxSide / (side || Math.max(img.width, img.height)));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round((square ? side : img.width) * scale); canvas.height = Math.round((square ? side : img.height) * scale);
      const sx = square ? (img.width - side) / 2 : 0; const sy = square ? (img.height - side) / 2 : 0;
      canvas.getContext('2d').drawImage(img, sx, sy, square ? side : img.width, square ? side : img.height, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url); resolve(canvas.toDataURL('image/jpeg', 0.84));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

const coverBackground = (c) => c.tone === 'custom' ? `linear-gradient(${c.angle}deg, ${c.c1}, ${c.c2})` : COVER_TONES[c.tone]?.[1] || COVER_TONES.aurora[1];

/** Portada + foto de perfil + textos. `update(draft)` repinta; se usa en la vista previa y en el perfil público. */
export function profileHero(record, draft, { editable = false, onPickCover, onPickAvatar, eyebrow, tags = (d) => [d.discipline, d.tagline] } = {}) {
  const cover = el('div', { className: 'pe-cover' }, [el('img', { className: 'pe-cover-img', alt: '', decoding: 'async' }), el('span', { className: 'pe-cover-pattern', attrs: { 'aria-hidden': 'true' } })]);
  const pick = (label, iconName, className, handler) => el('label', { className: `pe-pick ${className}` }, [icon(iconName, { size: 20 }), el('span', { text: label }), el('input', { type: 'file', accept: 'image/*', className: 'sr-only', onchange: (event) => { const file = event.target.files[0]; event.target.value = ''; if (file) handler(file); } })]);
  const face = el('span', { className: 'pe-avatar' });
  const kicker = el('span', { className: 'eyebrow', text: eyebrow || record.eyebrow || 'Artes vivas · CDMX' });
  const name = el('h1'); const line = el('p', { className: 'pe-tags' }); const short = el('p', { className: 'pe-short' });
  const node = el('section', { className: 'pe-hero' }, [
    el('div', { className: 'pe-cover-wrap' }, [cover, editable ? pick('Cambiar portada', 'image', 'pe-pick-cover', onPickCover) : null]),
    el('div', { className: 'pe-id' }, [el('div', { className: 'pe-avatar-wrap' }, [face, editable ? pick('Cambiar foto', 'plus', 'pe-pick-avatar', onPickAvatar) : null]), el('div', { className: 'pe-copy' }, [kicker, name, line, short])]),
  ]);
  function update(d) {
    node.style.setProperty('--pe-cover-h', `${d.cover.height}px`);
    node.style.setProperty('--pe-avatar', `${d.avatar.size}px`);
    node.style.setProperty('--pe-accent', d.accent);
    node.style.setProperty('--pe-font', FONTS[d.font]?.[1] || FONTS.moderna[1]);
    cover.style.background = coverBackground(d.cover);
    const image = $('.pe-cover-img', cover); image.hidden = !d.cover.image; if (d.cover.image) image.src = d.cover.image; else image.removeAttribute('src');
    cover.classList.toggle('no-pattern', !d.cover.pattern);
    node.dataset.shape = d.avatar.shape; node.dataset.ring = String(d.avatar.ring);
    face.replaceChildren(d.avatar.image ? el('img', { className: 'avatar', src: d.avatar.image, alt: '' }) : avatar({ slug: record.slug, name: d.name || record.name || '?' }));
    name.textContent = d.name || 'Tu nombre';
    line.textContent = tags(d).filter(Boolean).join(' • ');
    short.textContent = d.bio;
  }
  update(draft);
  return { node, update };
}

/** Campos enlazados a `draft` por ruta ("cover.height"). `onChange` se llama tras cada cambio. */
export function formKit(draft, onChange) {
  const refreshers = []; const checks = []; let seq = 0;
  const changed = () => { refreshers.forEach((fn) => fn()); onChange(); };
  const uid = (path) => `pe-${path.replace(/\W+/g, '-')}-${seq++}`;
  const field = (label, control, wide, id, extra) => el('div', { className: `pe-field${wide ? ' wide' : ''}` }, [el('label', { htmlFor: id, text: label }), control, extra]);
  // Control suelto (input/textarea) sin etiqueta visible: para filas como los horarios.
  const control = (path, { area, max = 200, type = 'text', placeholder = '', rows = 4, inputmode, label } = {}) => {
    const c = el(area ? 'textarea' : 'input', { id: uid(path), name: path, maxLength: max, placeholder, ...(area ? { rows } : { type }) });
    if (inputmode) c.inputMode = inputmode;
    if (label) c.setAttribute('aria-label', label);
    c.value = get(draft, path) ?? '';
    c.addEventListener('input', () => { set(draft, path, c.value); changed(); });
    refreshers.push(() => { const v = get(draft, path) ?? ''; if (c.value !== String(v)) c.value = v; });
    return c;
  };
  // `check` bloquea el guardado; `warn` solo advierte.
  const text = (path, label, { check, warn, wide, area, ...rest } = {}) => {
    const c = control(path, { area, ...rest });
    const out = el('small', { className: 'pe-err', id: `${c.id}-err`, attrs: { role: 'alert' } });
    c.setAttribute('aria-describedby', out.id);
    if (check || warn) {
      let touched = false;
      const run = () => { touched = true; const v = get(draft, path); const err = check?.(v, draft) || ''; const note = err ? '' : (warn?.(v, draft) || ''); out.textContent = err || note; out.classList.toggle('warn', !!note); c.setAttribute('aria-invalid', String(!!err)); return !!err; };
      checks.push({ run, control: c }); c.addEventListener('blur', run); refreshers.push(() => { if (touched) run(); });
    }
    return field(label, c, wide || area, c.id, out);
  };
  const range = (path, label, min, max, unit = 'px') => {
    const out = el('output'); const c = el('input', { id: uid(path), type: 'range', min, max, step: 2, name: path });
    const sync = () => { c.value = get(draft, path); out.textContent = `${c.value}${unit}`; };
    c.addEventListener('input', () => { set(draft, path, Number(c.value)); changed(); });
    refreshers.push(sync); sync();
    return field(label, el('span', { className: 'pe-range' }, [c, out]), false, c.id);
  };
  const select = (path, label, options, wide) => {
    const c = el('select', { id: uid(path), name: path }, options.map(([value, name]) => el('option', { value, text: name })));
    c.value = get(draft, path); c.addEventListener('change', () => { set(draft, path, c.value); changed(); });
    refreshers.push(() => { c.value = get(draft, path); });
    return field(label, c, wide, c.id);
  };
  const toggle = (path, label) => {
    const c = el('input', { type: 'checkbox', name: path }); c.checked = !!get(draft, path);
    c.addEventListener('change', () => { set(draft, path, c.checked); changed(); });
    refreshers.push(() => { c.checked = !!get(draft, path); });
    return el('label', { className: 'pe-toggle' }, [c, el('span', { text: label })]);
  };
  const color = (path, label) => { const c = el('input', { id: uid(path), type: 'color', name: path }); c.value = get(draft, path); c.addEventListener('input', () => { set(draft, path, c.value); changed(); }); refreshers.push(() => { c.value = get(draft, path); }); return field(label, c, false, c.id); };
  // Botones con aria-pressed: `items` = [[valor, etiqueta, estilo?, icono?]]
  const choices = (label, items, isOn, pick, className = '') => {
    const buttons = items.map(([value, name, style, iconName]) => { const b = el('button', { type: 'button', className: `pe-chip ${className}`, style: style || undefined, title: name, text: className === 'swatch' || iconName ? '' : name, attrs: { 'aria-label': name } }, iconName ? [icon(iconName, { size: 22 })] : []); b.addEventListener('click', () => { pick(value); changed(); }); return [value, b]; });
    const sync = () => buttons.forEach(([value, b]) => b.setAttribute('aria-pressed', String(isOn(value))));
    refreshers.push(sync); sync();
    return el('div', { className: 'pe-field wide', attrs: { role: 'group', 'aria-label': label } }, [el('span', { className: 'pe-label', text: label }), el('div', { className: 'pe-chips' }, buttons.map(([, b]) => b))]);
  };
  // Casillas para una lista de opciones guardada como arreglo de claves.
  const checkGroup = (path, label, items) => {
    const boxes = items.map(([value, name]) => { const c = el('input', { type: 'checkbox', value }); c.addEventListener('change', () => { const now = new Set(get(draft, path)); if (c.checked) now.add(value); else now.delete(value); set(draft, path, [...now]); changed(); }); return [value, c, name]; });
    refreshers.push(() => boxes.forEach(([value, c]) => { c.checked = get(draft, path).includes(value); }));
    return el('fieldset', { className: 'pe-field wide pe-checks' }, [el('legend', { text: label }), el('div', { className: 'pe-checkgrid' }, boxes.map(([, c, name]) => el('label', { className: 'pe-toggle' }, [c, el('span', { text: name })])))]);
  };
  const card = (iconName, title, body, hint) => el('section', { className: 'pe-card' }, [el('div', { className: 'block-title' }, [el('h2', {}, [icon(iconName, { size: 24 }), title])]), hint ? el('p', { className: 'muted pe-hint', text: hint }) : null, el('div', { className: 'pe-grid' }, body)]);
  const validate = () => checks.filter(({ run }) => run()).map(({ control: c }) => c)[0] || null;
  return { draft, refreshers, changed, field, control, text, range, select, toggle, color, choices, checkGroup, card, validate };
}

export const socialFields = (kit) => SOCIALS.map(([id, name, placeholder]) => kit.text(`social.${id}`, name, { placeholder }));

/** Tarjetas «Portada y foto» y «Estilo», iguales en artista y foro. */
export function lookCards(kit, draft) {
  const { text, range, select, toggle, color, choices, card, changed } = kit;
  const customRow = el('div', { className: 'pe-grid pe-custom wide' }, [color('cover.c1', 'Color inicial'), color('cover.c2', 'Color final'), range('cover.angle', 'Ángulo', 0, 360, '°')]);
  kit.refreshers.push(() => { customRow.hidden = draft.cover.tone !== 'custom'; });
  const clear = (label, apply) => { const b = el('button', { type: 'button', className: 'button secondary', text: label }); b.addEventListener('click', () => { apply(); changed(); }); return b; };
  const clearCover = clear('Quitar imagen de portada', () => { draft.cover.image = ''; });
  const clearAvatar = clear('Quitar foto de perfil', () => { draft.avatar.image = ''; });
  kit.refreshers.push(() => { clearCover.hidden = !draft.cover.image; clearAvatar.hidden = !draft.avatar.image; });
  return [
    card('image', 'Portada y foto', [
      choices('Fondo de portada', Object.entries(COVER_TONES).map(([value, [name, css]]) => [value, name, css ? `background:${css}` : 'background:conic-gradient(#F21F6D,#FF9D2E,#00C7D4,#8A3FFC,#F21F6D)']), (v) => draft.cover.tone === v, (v) => { draft.cover.tone = v; }, 'swatch'),
      customRow, range('cover.height', 'Altura de la portada', 160, 380), toggle('cover.pattern', 'Mostrar patrón decorativo'), clearCover,
      range('avatar.size', 'Tamaño de la foto', 110, 240), select('avatar.shape', 'Forma de la foto', [['circle', 'Círculo'], ['blob', 'Orgánica'], ['square', 'Cuadrada']]), toggle('avatar.ring', 'Aro de colores'), clearAvatar,
    ], 'Usa los botones sobre la vista previa para subir tus imágenes.'),
    card('sparkles', 'Estilo', [choices('Color de acento', PALETTE.map((c) => [c, c, `background:${c}`]), (v) => draft.accent === v, (v) => { draft.accent = v; }, 'swatch'), color('accent', 'Color propio'), select('font', 'Tipografía del nombre', Object.entries(FONTS).map(([value, [name]]) => [value, name]))]),
  ];
}

/**
 * Armazón del editor: hero en vivo, tarjetas (`build(kit)`), barra de guardado, datos (exportar/importar/restablecer).
 * `slug` es la clave del borrador en el servicio; `record` el registro original.
 */
export function createEditor({ kind, slug, record, base, saved: stored, heroOptions, build, backHref, backLabel, heading, publicHref, switcher, remote, note, onRemoteSave, extraCards }) {
  let saved = stored || base;
  const draft = clone(saved);
  const replace = (next) => { Object.keys(draft).forEach((k) => delete draft[k]); Object.assign(draft, clone(next)); };
  let hero;
  const savebarStatus = el('span', { className: 'pe-status', attrs: { role: 'status' }, text: 'Sin cambios' });
  const saveButton = el('button', { className: 'button', type: 'submit', text: 'Guardar cambios', disabled: true });
  const discardButton = el('button', { className: 'button ghost', type: 'button', text: 'Descartar', disabled: true });
  const isDirty = () => JSON.stringify(draft) !== JSON.stringify(saved);
  const kit = formKit(draft, () => {
    hero.update(draft);
    const dirty = isDirty(); saveButton.disabled = discardButton.disabled = !dirty;
    savebarStatus.textContent = dirty ? 'Cambios sin guardar' : 'Sin cambios'; savebarStatus.classList.toggle('dirty', dirty);
  });
  const pickImage = (path, side, square) => (file) => readImage(file, side, square).then((src) => { set(draft, path, src); kit.changed(); }).catch((e) => announce(e.message));
  hero = profileHero(record, draft, { ...heroOptions, editable: true, onPickCover: pickImage('cover.image', 1600, false), onPickAvatar: pickImage('avatar.image', 560, true) });

  const errorBox = el('p', { className: 'pe-error form-error', attrs: { role: 'alert' } });
  const button = (label, onclick, className = 'button secondary') => el('button', { type: 'button', className, text: label, onclick });
  const importInput = el('input', { type: 'file', accept: 'application/json,.json', className: 'sr-only', onchange: async (event) => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return; errorBox.textContent = '';
    try { const raw = JSON.parse(await file.text()); if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(); replace(normalizeDraft(kind, record, raw)); kit.changed(); announce('Borrador importado; revisa y guarda'); } catch { errorBox.textContent = 'El archivo no es un borrador JSON válido.'; }
  } });
  const dataCard = kit.card('settings', 'Datos', [
    el('div', { className: 'pe-account wide' }, [
      button('Exportar borrador (JSON)', () => { const link = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' })), download: `cuicoyan-${kind}-${slug}.json` }); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }),
      el('label', { className: 'button secondary' }, ['Importar borrador', importInput]),
      button('Restablecer a los datos originales', () => { if (!window.confirm('Se borrarán los cambios guardados de este registro y volverá a sus datos originales. ¿Continuar?')) return; removeDraft(kind, slug); saved = base; replace(base); kit.changed(); errorBox.textContent = ''; savebarStatus.textContent = 'Datos originales restablecidos'; announce('Datos originales restablecidos'); }, 'button ghost'),
    ]),
  ], 'Útil para pasar los cambios al backend más adelante.');

  const form = el('form', { className: 'pe-form', attrs: { novalidate: '' } }, [...build(kit, draft), ...(extraCards || []), dataCard, errorBox, el('div', { className: 'pe-savebar' }, [savebarStatus, discardButton, saveButton])]);
  discardButton.addEventListener('click', () => { replace(saved); kit.changed(); errorBox.textContent = ''; announce('Cambios descartados'); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); errorBox.textContent = '';
    const bad = kit.validate();
    if (bad) { errorBox.textContent = 'Revisa los campos marcados antes de guardar.'; bad.focus(); return; }
    saveButton.disabled = true;
    try {
      if (!saveDraft(kind, slug, draft)) throw new Error('No se pudo guardar: las imágenes pesan demasiado para este navegador. Quita o reduce fotos e inténtalo de nuevo.');
      if (remote) await onRemoteSave?.(draft);
      saved = clone(draft); kit.changed(); savebarStatus.textContent = 'Guardado ✓'; announce('Perfil guardado');
    } catch (error) { errorBox.textContent = error.message || 'No se pudo guardar el perfil.'; saveButton.disabled = false; }
  });
  window.addEventListener('beforeunload', (event) => { if (isDirty()) { event.preventDefault(); event.returnValue = ''; } });
  kit.changed();

  return el('main', { id: 'contenido', className: 'app-page profile-edit-page' }, [el('div', { className: 'app-wrap' }, [
    el('a', { className: 'back-link', href: backHref }, [icon('back', { size: 24 }), el('span', { text: backLabel || 'Regresar' })]),
    el('header', { className: 'app-head' }, [el('div', {}, [el('span', { className: 'eyebrow', text: heading.eyebrow }), el('h1', { text: heading.title })]), el('div', { className: 'pe-head-actions' }, [remote ? null : el('span', { className: 'badge', text: 'Modo demostración' }), publicHref ? el('a', { className: 'button secondary', href: publicHref }, ['Ver perfil público', icon('external', { size: 18 })]) : null])]),
    switcher || null,
    hero.node,
    note || null,
    form,
  ])]);
}
