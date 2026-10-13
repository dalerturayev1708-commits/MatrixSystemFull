/** Display helpers. Pure functions — safe to test and reuse. */

export function formatNumber(x, decimals = 4) {
  if (x === null || x === undefined) return '';
  if (typeof x !== 'number') return String(x);
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : 'NaN';
  if (Math.abs(x) < 10 ** -(decimals + 1)) return '0';
  const s = x.toFixed(decimals);
  const trimmed = s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  return trimmed === '-0' ? '0' : trimmed.replace('-', '−');
}

/** Parses user input: "3", "-2.5", "3/4", "−1", "1e3". Returns NaN when invalid. */
export function parseNumber(input) {
  if (typeof input === 'number') return input;
  const s = String(input).trim().replace(/−/g, '-').replace(',', '.');
  if (s === '') return NaN;
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = parseFloat(frac[2]);
    return d === 0 ? NaN : parseFloat(frac[1]) / d;
  }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
  return parseFloat(s);
}

export function matrixToText(M, decimals = 4, sep = '\t') {
  return M.map((row) => row.map((v) => formatNumber(v, decimals).replace('−', '-')).join(sep)).join('\n');
}

export function matrixToCSV(M) {
  return M.map((row) => row.join(',')).join('\n');
}

/** Parses tab, comma, semicolon or space separated text into a numeric matrix, or null. */
export function parseMatrixText(text) {
  if (!text || typeof text !== 'string') return null;
  const lines = text.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : lines[0].includes(',') ? ',' : /\s+/;
  const rows = lines.map((l) => l.split(sep).map((c) => c.trim()).filter((c) => c !== ''));
  const cols = rows[0].length;
  if (!cols || rows.some((r) => r.length !== cols)) return null;
  const M = rows.map((r) => r.map(parseNumber));
  if (M.some((r) => r.some((v) => !Number.isFinite(v)))) return null;
  if (M.length > 20 || cols > 20) return null;
  return M;
}

export const pad2 = (n) => String(n).padStart(2, '0');

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function daysBetween(a, b) {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

/** Subscript digits for index labels like a₁₂. */
const SUB = '₀₁₂₃₄₅₆₇₈₉';
export const sub = (n) => String(n).split('').map((d) => SUB[+d] ?? d).join('');

export function downloadText(filename, text, type = 'text/plain') {
  try {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
