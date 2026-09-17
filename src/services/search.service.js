import { normalizeText } from '../utils/normalize-text.js';

export function searchItems(items, { q = '', categoria = '', intencion = '' } = {}) {
  const query = normalizeText(q);
  return items.filter((item) => {
    const haystack = normalizeText([item.title, item.name, item.description, item.discipline, item.tagline, item.zone, ...(item.categorySlugs || [])].join(' '));
    const categoryOk = !categoria || (item.categorySlugs || []).includes(categoria);
    const intentionOk = !intencion || (item.intentions || []).includes(intencion);
    return categoryOk && intentionOk && (!query || haystack.includes(query));
  });
}
