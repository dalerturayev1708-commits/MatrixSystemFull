import { DICTIONARIES } from '../data/translations.js';
import { formatNumber } from './formatting.js';

/** Translate a key with {param} interpolation. Numbers are formatted. */
export function translate(lang, key, params = {}, decimals = 4) {
  const dict = DICTIONARIES[lang] || DICTIONARIES.en;
  let s = dict[key] ?? DICTIONARIES.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, p) => {
    const v = params[p];
    if (v === undefined) return `{${p}}`;
    return typeof v === 'number' ? formatNumber(v, decimals) : String(v);
  });
}

/** Translate an engine message object { key, params }. */
export function translateMsg(lang, m, decimals) {
  if (!m) return '';
  if (typeof m === 'string') return translate(lang, m, {}, decimals);
  return translate(lang, m.key, m.params, decimals);
}

/** Pick a localized field from { uz, en } objects with English fallback. */
export function pick(lang, obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] ?? obj.en ?? '';
}
