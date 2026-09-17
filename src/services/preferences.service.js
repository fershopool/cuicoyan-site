const KEY = 'cuicoyan:v1:preferences';
const defaults = { theme: 'system', interests: [] };
export function getPreferences() { try { return { ...defaults, ...(JSON.parse(localStorage.getItem(KEY) || '{}')) }; } catch { return { ...defaults }; } }
export function savePreferences(update) { const next = { ...getPreferences(), ...update }; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* sin persistencia */ } return next; }
export function clearPreferences() { try { localStorage.removeItem(KEY); localStorage.removeItem('cuicoyan:v1:favorites'); } catch { /* noop */ } }
