export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'attrs') Object.entries(value).forEach(([attr, attrValue]) => node.setAttribute(attr, attrValue));
    else if (key === 'style') node.setAttribute('style', value);
    else node[key] = value;
  });
  children.flat().filter(Boolean).forEach((child) => node.append(child.nodeType ? child : document.createTextNode(child)));
  return node;
}

export function announce(message) {
  const live = $('#site-live');
  if (!live) return;
  live.textContent = '';
  window.setTimeout(() => { live.textContent = message; }, 20);
}
