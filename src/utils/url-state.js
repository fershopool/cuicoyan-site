export function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  return { q: params.get('q') || '', categoria: params.get('categoria') || '', intencion: params.get('intencion') || '' };
}

export function goWithState(path, state = {}) {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => { if (value) params.set(key, value); });
  window.location.href = `${path}${params.toString() ? `?${params}` : ''}`;
}
