const KEY = 'cuicoyan:v1:favorites';
let memory = [];
function read() { try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return memory; } }
function write(value) { memory = value; try { localStorage.setItem(KEY, JSON.stringify(value.slice(0, 100))); } catch { /* memoria temporal */ } }
export const getFavorites = () => read();
export const isFavorite = (type, id) => read().some((item) => item.type === type && item.id === id);
export function toggleFavorite(type, id) { const current = read(); const exists = current.some((item) => item.type === type && item.id === id); const next = exists ? current.filter((item) => !(item.type === type && item.id === id)) : [...current, { type, id }]; write(next); return !exists; }
export const clearFavorites = () => write([]);
